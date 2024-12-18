"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoRepo = void 0;
const videos_model_1 = require("../models/videos.model");
class VideoRepo {
}
exports.VideoRepo = VideoRepo;
_a = VideoRepo;
VideoRepo.findByType = (type) => videos_model_1.VideoModel.find({ type });
VideoRepo.totalVideosCountQuery = (filter = {}) => videos_model_1.VideoModel.find(filter).countDocuments();
VideoRepo.totalMovieSeriesCountQuery = () => _a.totalVideosCountQuery({ type: { $in: ['movie', 'series'] } });
VideoRepo.totalMusicVideosCountQuery = () => _a.totalVideosCountQuery({ type: 'music video' });
VideoRepo.totalSkitVideosCOuntQuery = () => _a.totalVideosCountQuery({ type: 'skit' });
VideoRepo.searchTitleOrDescriptioneByTextReg = (textReg) => videos_model_1.VideoModel.find({
    $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
});
VideoRepo.geFeatured = () => videos_model_1.VideoModel.find({ featured: true });
VideoRepo.addFeatured = (id, expiry) => videos_model_1.VideoModel.findByIdAndUpdate(id, {
    featured: true,
    feat_expiry: new Date(expiry),
}, {
    upsert: true,
});
