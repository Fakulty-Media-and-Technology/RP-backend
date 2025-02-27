"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVODMedia = exports.deleteSeasons = exports.deleteSubtitles = exports.deleteTrailer = exports.deletePosters = exports.deleteVideoUploadS3Objects = void 0;
const poster_model_1 = require("../models/poster.model");
const subtitle_model_1 = require("../models/subtitle.model");
const trailer_model_1 = require("../models/trailer.model");
const videoupload_model_1 = require("../models/videoupload.model");
const s3_1 = require("../services/aws/s3");
const seasons_model_1 = require("../models/seasons.model");
const episodes_model_1 = require("../models/episodes.model");
const deleteVideoUploadS3Objects = async (vidUploadId) => {
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
exports.deleteVideoUploadS3Objects = deleteVideoUploadS3Objects;
const deletePosters = async (parentId) => {
    try {
        const posters = await poster_model_1.PosterImageModel.find({ video_id: parentId });
        posters.forEach(async ({ key, bucket }) => {
            try {
                await s3_1.S3.deleteObject(key, bucket);
                await poster_model_1.PosterImageModel.findOneAndDelete({ video_id: parentId });
            }
            catch (e) {
                console.error(`Error deleting poster with Key: ${key} => bucket: ${bucket} on VOD delete`);
            }
        });
    }
    catch (e) {
        console.error('Error deleting poster with video_id:', parentId);
    }
};
exports.deletePosters = deletePosters;
const deleteTrailer = async (parentId) => {
    try {
        const trailer = await trailer_model_1.TrailerModel.findOneAndDelete({ video_id: parentId });
        trailer && trailer.video_upload && (0, exports.deleteVideoUploadS3Objects)(trailer.video_upload);
    }
    catch (e) {
        console.error(`Error deleting trailer for parent with ID: ${parentId}`);
    }
};
exports.deleteTrailer = deleteTrailer;
const deleteSubtitles = async (parentId) => {
    try {
        const subtitles = await subtitle_model_1.SubtitleModel.find({ video_id: parentId });
        subtitles.forEach(async (subtitle) => {
            try {
                await s3_1.S3.deleteObject(subtitle.key, subtitle.bucket);
                await subtitle_model_1.SubtitleModel.findByIdAndDelete(subtitle._id);
            }
            catch (e) {
                console.error('Error deleting Subtitle:', subtitle._id);
            }
        });
    }
    catch (e) {
        console.error('Error deleting subtitles for parent:', parentId);
    }
};
exports.deleteSubtitles = deleteSubtitles;
const deleteSeasons = async (vodId) => {
    try {
        const seasons = await seasons_model_1.SeasonModel.find({ video: vodId });
        seasons.forEach(async (season) => {
            try {
                (0, exports.deletePosters)(season._id);
                (0, exports.deleteTrailer)(season._id);
                const episodes = await episodes_model_1.EpisodeModel.find({ season: season._id });
                episodes.forEach(async (ep) => {
                    (0, exports.deleteVideoUploadS3Objects)(ep.videoUpload);
                    (0, exports.deleteTrailer)(ep._id);
                });
                await seasons_model_1.SeasonModel.findByIdAndDelete(season._id);
            }
            catch (e) {
                console.error('Error deleting season for VOD:', vodId);
            }
        });
    }
    catch (e) {
        console.error('Error deleting seasons for series', vodId);
    }
};
exports.deleteSeasons = deleteSeasons;
const deleteVODMedia = async (vod) => {
    if (vod == null)
        return;
    const vodId = vod._id;
    try {
        (0, exports.deletePosters)(vodId);
        (0, exports.deleteSubtitles)(vodId);
        (0, exports.deleteTrailer)(vodId);
        (0, exports.deleteVideoUploadS3Objects)(vod.video_upload);
        if (vod.type !== 'series')
            return;
    }
    catch (e) {
        console.error('Error processing Post delete OPS for video with ID:', vodId);
    }
};
exports.deleteVODMedia = deleteVODMedia;
