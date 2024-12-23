"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const contestants_model_1 = require("../../models/contestants.model");
const voteInfo_model_1 = require("../../models/voteInfo.model");
const OperationalError_1 = require("../../utils/OperationalError");
class VoteService {
}
exports.VoteService = VoteService;
_a = VoteService;
VoteService.fetchVoteInfoByLiveId = async (liveId) => {
    if (typeof liveId !== 'string') {
        throw new OperationalError_1.OperationalError('required liveId must be a string', 400);
    }
    return await voteInfo_model_1.VoteInfoModel.find({ live_id: liveId });
};
VoteService.createVoteInfo = async (currentUser, data) => {
    if (currentUser.role !== 'tvshow') {
        throw new OperationalError_1.OperationalError('this feature is not available to you', 400);
    }
    const { live_id, price, status } = data;
    if (!live_id || !price || !status) {
        throw new OperationalError_1.OperationalError('all inputs are required', 400);
    }
    const voteExits = await voteInfo_model_1.VoteInfoModel.findOne({
        live_id: live_id,
    });
    if (voteExits) {
        throw new OperationalError_1.OperationalError('vote poll has already been created for this live event', 400);
    }
    await voteInfo_model_1.VoteInfoModel.create({
        live_id: live_id,
        client_id: currentUser._id,
        price: Number(price),
        status: status,
    });
};
VoteService.updateVoteInfo = async (currentUser, data) => {
    const { live_id, price, status } = data;
    const { id: client_id } = currentUser;
    const voteEx = await voteInfo_model_1.VoteInfoModel.findOne({
        client_id,
        live_id: live_id,
    });
    if (!voteEx) {
        throw new OperationalError_1.OperationalError('cannot find your live voting instance', 404);
    }
    await voteInfo_model_1.VoteInfoModel.findOneAndUpdate({
        client_id,
        live_id: live_id,
    }, {
        price: price ? Number(price) : voteEx.price,
        status: status ? status : voteEx.status,
    }, {
        upsert: true,
    });
};
VoteService.addVoteContestant = async (currentUser, data) => {
    const { live_id, names, photo, occupation, bio, contact } = data;
    if (currentUser.role !== 'tvshow') {
        throw new OperationalError_1.OperationalError('this feature is not available to you', 400);
    }
    if (!live_id || !names || !occupation || !bio || !contact) {
        throw new OperationalError_1.OperationalError('all inputs are required', 400);
    }
    await contestants_model_1.ContestantsModel.create({
        live_id: live_id,
        names: names,
        photo: photo,
        occupation: occupation,
        bio: bio,
        contact: contact,
    });
};
VoteService.voteStatusInfo = async (currentUser, live_id) => {
    if (currentUser.role !== 'tvshow') {
        throw new OperationalError_1.OperationalError('this feature is not available to you', 400);
    }
    const [voteInfo, contestantInfo] = await Promise.all([
        voteInfo_model_1.VoteInfoModel.find({ live_id }).select('-__v'),
        contestants_model_1.ContestantsModel.find({ live_id }).sort({ votes: -1 }),
    ]);
    const contestantInfoWithPhotoUrl = contestantInfo.map(async (event) => {
        return {
            ...event.toObject(),
            photo_url: await media_access_1.MediaAccess.getSignedUrl(event.photo.Bucket, event.photo.Key, 'photo'),
        };
    });
    return {
        vote_info: voteInfo,
        contestant_ranking: contestantInfoWithPhotoUrl,
    };
};
VoteService.removeVoteContestant = async (currentUser, data) => {
    if (currentUser.role !== 'tvshow') {
        throw new OperationalError_1.OperationalError('this feature is not available to you', 400);
    }
    const deletedContestant = await contestants_model_1.ContestantsModel.findOneAndDelete({
        live_id: data.liveId,
        _id: data.contestantId,
    });
    if (deletedContestant) {
        throw new OperationalError_1.OperationalError('contestant could not be deleted', 404);
    }
};
VoteService.fetchVoteContestants = (currentUser, liveId) => {
    if (currentUser && currentUser.role !== 'tvshow') {
        throw new OperationalError_1.OperationalError('this feature is not available to you', 400);
    }
    return contestants_model_1.ContestantsModel.find({ live_id: liveId });
};
