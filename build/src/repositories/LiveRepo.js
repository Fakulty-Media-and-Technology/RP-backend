"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveRepo = void 0;
const lives_model_1 = require("../models/lives.model");
class LiveRepo {
}
exports.LiveRepo = LiveRepo;
_a = LiveRepo;
LiveRepo.getActiveStreamKeys = async () => {
    const liveDocs = await lives_model_1.LiveModel.find({ active: true });
    return liveDocs.filter(doc => doc.stream_key != null).map(doc => doc.stream_key);
};
LiveRepo.getChannels = () => lives_model_1.LiveModel.find({ type: 'channel' });
LiveRepo.totalActiveVideosQuery = () => lives_model_1.LiveModel.find({ active: true });
LiveRepo.searchLivesByTextReg = (textReg) => {
    return lives_model_1.LiveModel.find({
        $or: [
            { title: { $regex: textReg } },
            { sub_title: { $regex: textReg } },
            { description: { $regex: textReg } },
        ],
    });
};
LiveRepo.getFeatured = () => {
    return lives_model_1.LiveModel.find({
        featured: true,
        expired: false,
    });
};
LiveRepo.addFeatured = (id, expiry) => {
    return lives_model_1.LiveModel.findByIdAndUpdate(id, {
        featured: true,
        feat_expiry: new Date(expiry),
    }, {
        upsert: true,
    });
};
LiveRepo.getActiveById = (id) => {
    return lives_model_1.LiveModel.findOne({ _id: id, active: true });
};
LiveRepo.getSelectedLive = (filter) => {
    return lives_model_1.LiveModel.find(filter).select('-__v -client_id -createdAt -updatedAt -sponsored -popular -likes -stream_key');
};
