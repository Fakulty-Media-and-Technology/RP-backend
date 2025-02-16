"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerVoteService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const contestants_model_1 = require("../../models/contestants.model");
const donate_model_1 = require("../../models/donate.model");
const lives_model_1 = require("../../models/lives.model");
const payments_model_1 = require("../../models/payments.model");
const users_model_1 = require("../../models/users.model");
const voteInfo_model_1 = require("../../models/voteInfo.model");
const votes_model_1 = require("../../models/votes.model");
const wallet_model_1 = require("../../models/wallet.model");
const OperationalError_1 = require("../../utils/OperationalError");
const VoteService_1 = require("./VoteService");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
class CustomerVoteService {
}
exports.CustomerVoteService = CustomerVoteService;
_a = CustomerVoteService;
CustomerVoteService._createVoteWithSession = async ({ currentUser, data }, session) => {
    const { live_id, contestant_id, payment_id, pay_ref } = data;
    const contestant = await contestants_model_1.ContestantsModel.findOne({
        _id: contestant_id,
        live_id: live_id,
    });
    if (contestant === null) {
        throw new OperationalError_1.OperationalError('invalid contestant arg, cannot vote', 400);
    }
    const validPay = await payments_model_1.PaymentModel.findOne({
        _id: payment_id,
        reference: pay_ref,
        status: 'success',
        is_used: false,
    });
    if (!validPay) {
        throw new OperationalError_1.OperationalError('invalid payment', 400);
    }
    const voteInfo = await voteInfo_model_1.VoteInfoModel.findOne({
        live_id,
    });
    if (!voteInfo) {
        throw new OperationalError_1.OperationalError('could not find vote info', 404);
    }
    if (validPay.amount !== voteInfo.price) {
        throw new OperationalError_1.OperationalError('amount paid is not equal to the pay', 404);
    }
    // TODO: Use Session // Handle Update errors
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: payment_id,
        reference: pay_ref,
    }, {
        is_used: true,
        use_case: 'vote',
    }, {
        upsert: true,
        session,
    });
    await new votes_model_1.VoteModel({
        live_id: live_id,
        contestant_id: contestant_id,
        voter_id: currentUser._id,
        payment_id: validPay._id,
    }).save({ session });
    await contestants_model_1.ContestantsModel.findOneAndUpdate({
        _id: contestant_id,
        live_id: live_id,
    }, {
        $inc: {
            votes: 1,
        },
    }, {
        upsert: true,
        session,
    });
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: voteInfo.client_id,
    }, {
        $inc: {
            balance: Number(validPay.amount),
        },
    }, {
        upsert: true,
        session,
    });
};
CustomerVoteService._donateFundWithSession = async ({ currentUser, data }, session) => {
    const { live_id, payment_id, pay_ref } = data;
    const validPay = await payments_model_1.PaymentModel.findOne({
        _id: payment_id,
        reference: pay_ref,
        status: 'success',
        is_used: false,
    });
    if (!validPay) {
        throw new OperationalError_1.OperationalError('invalid payment', 400);
    }
    const liveInfo = await lives_model_1.LiveModel.findById(live_id);
    if (liveInfo === null) {
        throw new OperationalError_1.OperationalError('invalid live id', 404);
    }
    const clientInfo = await users_model_1.UserModel.findById(liveInfo.client_id);
    if (clientInfo === null) {
        throw new OperationalError_1.OperationalError('iinvalid liveInfo client id', 404);
    }
    const donatableRoles = ['channel', 'event', 'podcast'];
    if (!donatableRoles.includes(clientInfo.role)) {
        throw new OperationalError_1.OperationalError(`You can only donate to ${donatableRoles.join(' || ')}`, 400);
    }
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: payment_id,
        reference: pay_ref,
    }, {
        is_used: true,
        use_case: 'donate',
    }, {
        upsert: true,
        session,
    });
    // TODO: Use session // handle errors
    await new donate_model_1.DonateModel({
        live_id: live_id,
        customer_id: currentUser._id,
        payment_id: validPay._id,
    }).save({ session });
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: clientInfo._id,
    }, {
        $inc: {
            balance: Number(validPay.amount),
        },
    }, {
        upsert: true,
        session,
    });
};
// ****************** PUBLIC ****************8
CustomerVoteService.fetchVoteInfoByLiveId = async (liveId) => {
    return await VoteService_1.VoteService.fetchVoteInfoByLiveId(liveId);
};
CustomerVoteService.fetchVoteContestantsByLiveId = async (liveId) => {
    const contestants = await VoteService_1.VoteService.fetchVoteContestants(undefined, liveId).sort({ names: 1 });
    return await Promise.all(contestants.map(async (event) => {
        return {
            ...event.toObject(),
            photo_url: await media_access_1.MediaAccess.getSignedUrl(event.photo.Bucket, event.photo.Key, 'photo'),
        };
    }));
};
CustomerVoteService.createVote = async (currentUser, data) => {
    await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createVoteWithSession, {
        currentUser,
        data,
    });
};
CustomerVoteService.donateFund = async (currentUser, data) => {
    await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._donateFundWithSession, {
        currentUser,
        data,
    });
};
