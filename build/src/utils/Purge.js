"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purge = void 0;
const poster_model_1 = require("../models/poster.model");
const subtitle_model_1 = require("../models/subtitle.model");
const trailer_model_1 = require("../models/trailer.model");
const videoupload_model_1 = require("../models/videoupload.model");
const s3_1 = require("../services/aws/s3");
const seasons_model_1 = require("../models/seasons.model");
const episodes_model_1 = require("../models/episodes.model");
class Purge {
}
exports.Purge = Purge;
_a = Purge;
Purge._videoUploadById = async (vidUploadId) => {
    try {
        const vidUpload = await videoupload_model_1.VideoUploadModel.findByIdAndDelete(vidUploadId);
        if (vidUpload == null)
            return;
        s3_1.S3.deleteObject(vidUpload.key, vidUpload.bucket).catch(() => {
            console.error(`Error deleting vidUpload with Key: ${vidUpload.key} => bucket: ${vidUpload.bucket}`);
        });
        vidUpload.resolutions.forEach(res => s3_1.S3.deleteObject(res.key, vidUpload.bucket).catch(() => {
            console.error(`Error deleting video Res with Key: ${res.key} => bucket: ${vidUpload.bucket}`);
        }));
    }
    catch (e) {
        console.error('Error deleting video upload with Id:', vidUploadId);
    }
};
Purge._postersByParentId = async (parentId) => {
    try {
        const posters = await poster_model_1.PosterImageModel.find({ video_id: parentId });
        await Promise.all(posters.map(async ({ key, bucket }) => {
            try {
                await s3_1.S3.deleteObject(key, bucket);
                await poster_model_1.PosterImageModel.findOneAndDelete({ video_id: parentId });
            }
            catch (e) {
                console.error(`Error deleting poster with Key: ${key} => bucket: ${bucket} on VOD delete`);
            }
        }));
    }
    catch (e) {
        console.error('Error deleting poster with video_id:', parentId);
    }
};
Purge._trailerByParentId = async (parentId) => {
    try {
        const trailer = await trailer_model_1.TrailerModel.findOneAndDelete({ video_id: parentId });
        trailer && trailer.video_upload && _a._videoUploadById(trailer.video_upload);
    }
    catch (e) {
        console.error(`Error deleting trailer for parent with ID: ${parentId}`);
    }
};
Purge._subtitlesByParentId = async (parentId) => {
    try {
        const subtitles = await subtitle_model_1.SubtitleModel.find({ video_id: parentId });
        await Promise.all(subtitles.map(async (subtitle) => {
            try {
                await s3_1.S3.deleteObject(subtitle.key, subtitle.bucket);
                await subtitle_model_1.SubtitleModel.findByIdAndDelete(subtitle._id);
            }
            catch (e) {
                console.error('Error deleting Subtitle:', subtitle._id);
            }
        }));
    }
    catch (e) {
        console.error('Error deleting subtitles for parent:', parentId);
    }
};
Purge._seasonsByVideoId = async (vodId) => {
    try {
        const seasons = await seasons_model_1.SeasonModel.find({ video: vodId });
        await Promise.all(seasons.map(async (season) => {
            try {
                _a._postersByParentId(season._id);
                _a._trailerByParentId(season._id);
                const episodes = await episodes_model_1.EpisodeModel.find({ season: season._id });
                episodes.forEach(async (ep) => {
                    _a._videoUploadById(ep.videoUpload);
                    _a._trailerByParentId(ep._id);
                });
                await seasons_model_1.SeasonModel.findByIdAndDelete(season._id);
            }
            catch (e) {
                console.error('Error deleting season for VOD:', vodId);
            }
        }));
    }
    catch (e) {
        console.error('Error deleting seasons for series', vodId);
    }
};
Purge.vod = async (vod) => {
    await Promise.all([
        _a._postersByParentId(vod._id),
        _a._subtitlesByParentId(vod._id),
        _a._trailerByParentId(vod._id),
        _a._videoUploadById(vod.video_upload),
    ]);
    if (vod.type === 'series')
        await _a._seasonsByVideoId(vod._id);
};
