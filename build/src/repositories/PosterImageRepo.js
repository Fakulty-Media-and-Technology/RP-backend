"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterImageRepo = void 0;
const poster_model_1 = require("../models/poster.model");
class PosterImageRepo {
}
exports.PosterImageRepo = PosterImageRepo;
PosterImageRepo.findByVideoId = (vidId) => poster_model_1.PosterImageModel.findOne({ video_id: vidId });
