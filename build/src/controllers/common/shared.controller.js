"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedController = void 0;
const MediaService_1 = require("../../services/core/MediaService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
const UploadMediaUtils_1 = require("../../utils/UploadMediaUtils");
class SharedController extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.SharedController = SharedController;
_a = SharedController;
SharedController.updateProfile = (authType) => Catch_1.Catch.async(async (req, res) => {
    if (Object.values(req.body).length === 0 && req.file == null) {
        throw new OperationalError_1.OperationalError('Provide at least one property to update', 400);
    }
    Object.assign(req.body, req.params);
    await MediaService_1.MediaService.updateUserProfile({
        imageFile: req.file,
        data: req.body,
        authType,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'Update successfull',
    });
});
SharedController.createLive = ({ isAdmin }) => Catch_1.Catch.async(async (req, res) => {
    const { data: _data } = req.body;
    if (_data == null || typeof _data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const files = _a._checkFiles(req.files);
    const parsedData = JSON.parse(_data);
    const data = {
        ...parsedData,
        previewVideo: files.previewVideo?.[0],
        channelLogo: files.channelLogo?.[0],
        coverPhoto: files.coverPhoto?.[0],
        clientId: isAdmin ? parsedData.clientId : GetDefined_1.GetDefined.loggedInUser(req.user).id,
    };
    (0, requestValidator_1.validate)(admin_1.addLiveSchema, data);
    (0, responder_1.sendResponse)({
        res,
        data: await MediaService_1.MediaService.createLive(data),
        message: `Live will be attached to ${isAdmin ? 'client' : 'your'} dashboard after processing`,
    });
});
SharedController.adminGetPhotoUrl = Catch_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const image = await MediaService_1.MediaService.getPhotoUrl(bucket, key);
    (0, responder_1.sendResponse)({ res, data: image, message: 'image fetched' });
});
SharedController.adminGetSubtitleUrl = Catch_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const subtitle = await MediaService_1.MediaService.getSubtitleUrl(bucket, key);
    (0, responder_1.sendResponse)({ res, data: subtitle, message: 'subtitle fetched' });
});
SharedController.getVidoeUploadStream = Catch_1.Catch.async(async (req, res) => {
    const _vodStream = await MediaService_1.MediaService.getVodStream(req.params.vidUploadId, GetDefined_1.GetDefined.loggedInUser(req.user));
    (0, responder_1.sendResponse)({ res, data: _vodStream, message: 'stream fetched' });
});
SharedController.getSubtitles = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await MediaService_1.MediaService.getSubtitles(req.params.parentId),
    });
});
