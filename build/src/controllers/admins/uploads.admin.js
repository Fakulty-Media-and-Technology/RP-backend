"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadController = void 0;
const requestValidator_1 = require("../../middlewares/requestValidator");
const videos_model_1 = require("../../models/videos.model");
const AdminUploadService_1 = require("../../services/core/AdminUploadService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
const UploadMediaUtils_1 = require("../../utils/UploadMediaUtils");
const admin_1 = require("../../validations/admin");
class AdminUploadController extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.AdminUploadController = AdminUploadController;
_a = AdminUploadController;
AdminUploadController._validateVideoType = (type) => {
    if (!videos_model_1.videoTypes.includes(type)) {
        throw new OperationalError_1.OperationalError(`Valid video types are ${videos_model_1.videoTypes.join(' || ')} `, 400);
    }
    return type;
};
AdminUploadController.addVideo = Catch_1.Catch.async(async ({ files: reqFiles, body, user, params }, res) => {
    const type = _a._validateVideoType(params.type);
    const admin = GetDefined_1.GetDefined.loggedInUser(user);
    const { data: _data } = body;
    if (_data == null || typeof _data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const files = _a._checkFiles(reqFiles);
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
    const files = _a._checkFiles(reqFiles);
    const _data = {
        description: body.description,
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
        const files = _a._checkFiles(req.files);
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
AdminUploadController.editVideo = Catch_1.Catch.async(async ({ params, body, user, files: reqFiles }, res) => {
    if (body.data != null && typeof body.data !== 'string') {
        throw new OperationalError_1.OperationalError('optional formData.data must be a JSON serialized string', 400);
    }
    const files = _a._checkFiles(reqFiles);
    const data = {
        landscapePoster: files.landscapePoster?.[0],
        portraitPoster: files.portraitPoster?.[0],
        trailer: files.trailer?.[0],
        video: files.video?.[0],
    };
    if (body.data) {
        Object.assign(data, JSON.parse(body.data));
    }
    (0, requestValidator_1.validate)(admin_1.editVideoSchema, data);
    const updatedVid = await AdminUploadService_1.AdminUploadService.editVideo({
        data,
        videoId: params.id,
        adminId: GetDefined_1.GetDefined.loggedInUser(user).id,
    });
    (0, responder_1.sendResponse)({
        res,
        data: updatedVid,
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
