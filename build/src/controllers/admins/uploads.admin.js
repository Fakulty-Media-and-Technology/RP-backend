"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadController = exports.checkFiles = void 0;
const requestValidator_1 = require("../../middlewares/requestValidator");
const videos_model_1 = require("../../models/videos.model");
const AdminUploadService_1 = require("../../services/core/AdminUploadService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
const admin_1 = require("../../validations/admin");
const checkFiles = (files) => {
    if (files == null) {
        throw new OperationalError_1.OperationalError('expected at least one file', 400);
    }
    if (Array.isArray(files)) {
        throw new OperationalError_1.OperationalError('expected multiple files as an object', 400);
    }
    return files;
};
exports.checkFiles = checkFiles;
class AdminUploadController {
}
exports.AdminUploadController = AdminUploadController;
_a = AdminUploadController;
AdminUploadController._validateVideoType = (type) => {
    if (!videos_model_1.videoTypes.includes(type)) {
        throw new OperationalError_1.OperationalError(`Valid video types are ${videos_model_1.videoTypes.join(' || ')} `, 400);
    }
    return type;
};
AdminUploadController._validateAddMovieData = (type, data, files) => {
    if (type === 'series') {
        (0, requestValidator_1.validate)(admin_1.addSeriesSchema, data);
        return;
    }
    Object.assign(data, {
        ...data,
        video: files.video?.[0],
    });
    switch (type) {
        case 'movie':
            (0, requestValidator_1.validate)(admin_1.addMovieOrSkitSchema, data);
            break;
        case 'skit':
            (0, requestValidator_1.validate)(admin_1.addMovieOrSkitSchema, data);
            break;
        case 'music-video':
            (0, requestValidator_1.validate)(admin_1.addMusicVideoSchema, data);
            break;
        default:
            throw new OperationalError_1.OperationalError(`Valid movie types are ${videos_model_1.videoTypes.join(' || ')} `, 400);
    }
};
AdminUploadController.addVideo = Catch_1.Catch.async(async ({ files: reqFiles, body, user, params }, res) => {
    const type = _a._validateVideoType(params.type);
    const admin = GetDefined_1.GetDefined.loggedInUser(user);
    const { data: _data } = body;
    if (_data == null || typeof _data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const files = (0, exports.checkFiles)(reqFiles);
    if (Object.keys(files).length === 0) {
        throw new OperationalError_1.OperationalError('Expected at least one file', 400);
    }
    const data = {
        ...JSON.parse(body.data),
        landscapePoster: files.landscapePoster?.[0],
        portraitPoster: files.portraitPoster?.[0],
        trailer: files.trailer?.[0],
    };
    _a._validateAddMovieData(type, data, files);
    (0, responder_1.sendResponse)({
        res,
        message: `${type} added successfully`,
        data: await AdminUploadService_1.AdminUploadService.addVideo({
            type,
            data: data,
            adminId: admin.id,
        }),
    });
});
AdminUploadController.addSeason = Catch_1.Catch.async(async ({ files: reqFiles, body, user, params }, res) => {
    const files = (0, exports.checkFiles)(reqFiles);
    const _data = {
        trailerLink: body.trailerLink,
        portraitPhoto: files['portraitPhoto']?.[0],
        landscapePhoto: files['landscapePhoto']?.[0],
        trailer: files['trailer']?.[0],
    };
    (0, requestValidator_1.validate)(admin_1.createSeasonSchema, _data);
    const data = { ..._data, videoId: params.videoId, adminId: GetDefined_1.GetDefined.loggedInUser(user).id };
    (0, responder_1.sendResponse)({
        res,
        message: `season added successfully`,
        data: await AdminUploadService_1.AdminUploadService.addSeason(data),
    });
});
AdminUploadController.addEpisode = Catch_1.Catch.async(async (req, res) => {
    if (req.body.data == null || typeof req.body.data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const data = {
        ...JSON.parse(req.body.data),
    };
    if (!!req.files) {
        const files = (0, exports.checkFiles)(req.files);
        Object.assign(data, {
            trailer: files.trailer?.[0],
            video: files.video?.[0],
        });
    }
    (0, requestValidator_1.validate)(admin_1.addEpisodeSchema, data);
    (0, responder_1.sendResponse)({
        res,
        message: 'episode added successfully',
        data: await AdminUploadService_1.AdminUploadService.addEpisode({
            seasonId: req.params.seasonId,
            adminId: GetDefined_1.GetDefined.loggedInUser(req.user).id,
            data,
        }),
    });
});
AdminUploadController.editVideo = Catch_1.Catch.async(async ({ params, body }, res) => {
    const type = _a._validateVideoType(params.type);
    const updatedVid = await AdminUploadService_1.AdminUploadService.editVideo({
        vidId: params.id,
        changes: body,
        type,
    });
    (0, responder_1.sendResponse)({
        res,
        data: updatedVid,
        message: `${type} edited successfully`,
    });
});
AdminUploadController.fetchVideos = Catch_1.Catch.async(async ({ query, params }, res) => {
    const type = _a._validateVideoType(params.type);
    (0, responder_1.sendResponse)({
        res,
        message: `${type}s fetched successfully`,
        data: await AdminUploadService_1.AdminUploadService.getVideos(type, query),
    });
});
AdminUploadController.fetchSeasonsAndEpisodes = Catch_1.Catch.async(async ({ query, params }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: `seasons fetched successfully`,
        data: await AdminUploadService_1.AdminUploadService.getSeasonsAndEpisodes(params.vidId, query),
    });
});
AdminUploadController.deleteVideo = Catch_1.Catch.async(async ({ params }, res) => {
    const type = _a._validateVideoType(params.type);
    await AdminUploadService_1.AdminUploadService.deleteVideo(params.id, type);
    (0, responder_1.sendResponse)({
        res,
        message: `${type} deleted successfully`,
    });
});
