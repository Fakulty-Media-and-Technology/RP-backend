"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const VideoRepo_1 = require("../../repositories/VideoRepo");
const LiveService_1 = require("./LiveService");
class VideoService {
}
exports.VideoService = VideoService;
_a = VideoService;
VideoService.Live = LiveService_1.LiveService;
VideoService.searceByText = async (text) => await VideoRepo_1.VideoRepo.searchTitleOrDescriptioneByTextReg(new RegExp(text, 'i'));
VideoService.addFeatured = async (id, expiry) => await VideoRepo_1.VideoRepo.addFeatured(id, expiry);
VideoService.getFeaturedVideos = async () => await VideoRepo_1.VideoRepo.geFeatured();
