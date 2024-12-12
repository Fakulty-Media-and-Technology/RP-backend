"use strict";
const ContestantsModel = require('../../models/contestants.model');
const DonateModel = require('../../models/donate.model');
const LivesModel = require('../../models/lives.model');
const PaymentsModel = require('../../models/payments.model');
const UsersModel = require('../../models/users.model');
const VoteInfoModel = require('../../models/voteInfo.model');
const VotesModel = require('../../models/votes.model');
const WalletModel = require('../../models/wallet.model');
const { readPhotos } = require('../../services/media-access');
const { invalidRequest, successResponse, serverError, failedResponse, } = require('../../utils/response.handler');
exports.fetchVoteInfo = async (req, res) => {
    try {
        const { live_id } = req.query;
        if (!live_id) {
            return invalidRequest(res, 400, null, 'Query param `live_id` is required');
        }
        const voteInfo = await VoteInfoModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$live_id',
                            {
                                $toObjectId: live_id,
                            },
                        ],
                    },
                },
            },
        ]);
        return successResponse(res, 200, voteInfo[0], 'vote info fetched');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.fetchVoteContestants = async (req, res) => {
    try {
        const { live_id } = req.query;
        if (!live_id) {
            return invalidRequest(res, 400, null, 'Query param `live_id` is required');
        }
        const voteContes = await ContestantsModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$live_id',
                            {
                                $toObjectId: live_id,
                            },
                        ],
                    },
                },
            },
            {
                $sort: {
                    names: 1,
                },
            },
        ]);
        for (let event of voteContes) {
            if (event.photo && event.photo.Bucket && event.photo.Key) {
                const signedUrl = await readPhotos(event.photo.Bucket, event.photo.Key);
                event.photo_url = signedUrl.status == 400 ? 'no picture' : signedUrl;
            }
            else {
                event.photo_url = 'no picture';
            }
        }
        return successResponse(res, 200, voteContes, 'vote contestants fetched');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.createVote = async (req, res) => {
    try {
        const { live_id, contestant_id, payment_id, pay_ref } = req.body;
        const user = req.user;
        const contestant = await ContestantsModel.findOne({
            _id: contestant_id,
            live_id: live_id,
        });
        if (!contestant) {
            return invalidRequest(res, 400, null, 'invalid args, cannot vote');
        }
        const validPay = await PaymentsModel.findOne({
            _id: payment_id,
            reference: pay_ref,
            status: 'success',
            is_used: false,
        });
        if (!validPay) {
            return invalidRequest(res, 400, null, 'invalid payment');
        }
        const voteInfo = await VoteInfoModel.findOne({
            live_id: live_id,
        });
        if (Number(validPay.amount) !== Number(voteInfo.price)) {
            return invalidRequest(res, 400, null, 'amount paid is not equal to the pay');
        }
        await PaymentsModel.findOneAndUpdate({
            _id: payment_id,
            reference: pay_ref,
        }, {
            is_used: true,
            use_case: 'vote',
        }, {
            upsert: true,
        });
        await new VotesModel({
            live_id: live_id,
            contestant_id: contestant_id,
            voter_id: user._id,
            payment_id: validPay._id,
        }).save();
        await ContestantsModel.findOneAndUpdate({
            _id: contestant_id,
            live_id: live_id,
        }, {
            $inc: {
                votes: 1,
            },
        }, {
            upsert: true,
        });
        await WalletModel.findOneAndUpdate({
            user_id: voteInfo.client_id,
        }, {
            $inc: {
                balance: Number(validPay.amount),
            },
        }, {
            upsert: true,
        });
        return successResponse(res, 200, null, 'vote created');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.donateFund = async (req, res) => {
    try {
        const { live_id, payment_id, pay_ref } = req.body;
        const user = req.user;
        const validPay = await PaymentsModel.findOne({
            _id: payment_id,
            reference: pay_ref,
            status: 'success',
            is_used: false,
        });
        const liveInfo = await LivesModel.findOne({
            _id: live_id,
        });
        const clientInfo = await UsersModel.findOne({
            _id: liveInfo.client_id,
        });
        if (!['channel', 'event', 'podcast'].includes(clientInfo.role)) {
            return failedResponse(res, 400, null, 'you can only donate to `channel, event, podcast` users');
        }
        if (!validPay) {
            return invalidRequest(res, 400, null, 'invalid payment');
        }
        await PaymentsModel.findOneAndUpdate({
            _id: payment_id,
            reference: pay_ref,
        }, {
            is_used: true,
            use_case: 'donate',
        }, {
            upsert: true,
        });
        await new DonateModel({
            live_id: live_id,
            customer_id: user._id,
            payment_id: validPay._id,
        }).save();
        await WalletModel.findOneAndUpdate({
            user_id: clientInfo._id,
        }, {
            $inc: {
                balance: Number(validPay.amount),
            },
        }, {
            upsert: true,
        });
        return successResponse(res, 200, null, 'fund donated');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
