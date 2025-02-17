"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const MediaService_1 = require("../../services/core/MediaService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
const UploadMediaUtils_1 = require("../../utils/UploadMediaUtils");
class MediaController extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.MediaController = MediaController;
_a = MediaController;
MediaController.createLive = ({ isAdmin }) => Catch_1.Catch.async(async (req, res) => {
    const { data: _data } = req.body;
    if (_data == null || typeof _data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const files = _a._checkFiles(req.files);
    const parsedData = JSON.parse(_data);
    const data = {
        ...parsedData,
        previewVideo: files.previewVideo?.[0],
        coverPhoto: files.coverPhoto?.[0],
        clientId: isAdmin ? parsedData.clientId : GetDefined_1.GetDefined.loggedInUser(req.user).id,
    };
    (0, requestValidator_1.validate)(admin_1.addLiveSchema, data);
    (0, responder_1.sendResponse)({
        res,
        data: await MediaService_1.MedaiService.createLive(data),
        message: 'live stream created, credentials are on attached user dashboard',
    });
});
MediaController.adminGetPhotoUrl = Catch_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const image = await MediaService_1.MedaiService.getPhotoUrl(bucket, key);
    (0, responder_1.sendResponse)({ res, data: image, message: 'image fetched' });
});
MediaController.adminGetSubtitleUrl = Catch_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const subtitle = await MediaService_1.MedaiService.getSubtitleUrl(bucket, key);
    (0, responder_1.sendResponse)({ res, data: subtitle, message: 'subtitle fetched' });
});
MediaController.getVidoeUploadStream = Catch_1.Catch.async(async (req, res) => {
    const _vodStream = await MediaService_1.MedaiService.getVodStream(req.params.vidUploadId, GetDefined_1.GetDefined.loggedInUser(req.user));
    (0, responder_1.sendResponse)({ res, data: _vodStream, message: 'stream fetched' });
});
MediaController.getSubtitles = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await MediaService_1.MedaiService.getSubtitles(req.params.parentId),
    });
});
