"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingService = void 0;
const trailer_model_1 = require("../../models/trailer.model");
const upcoming_model_1 = require("../../models/upcoming.model");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const AdminUploadService_1 = require("./AdminUploadService");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const UpcomingRepo_1 = require("../../repositories/UpcomingRepo");
const UpcomingMediaSourceUtils_1 = require("../../utils/UpcomingMediaSourceUtils");
const VideoUploadUtils_1 = require("../../utils/VideoUploadUtils");
class UpcomingService extends AdminUploadService_1.AdminUploadService {
}
exports.UpcomingService = UpcomingService;
_a = UpcomingService;
UpcomingService._createUpcomingWithSession = async (data, session) => {
    if (data.trailer && data.trailerLink) {
        throw new OperationalError_1.OperationalError('trailer and trailerLink are optional but only ONE MAY be provided', 400);
    }
    _a._allowMimetype(data.landscapePhoto, 'image', 'landscapePhoto must be an image');
    _a._allowMimetype(data.portraitPhoto, 'image', 'portraitPhoto must be an image');
    const upcoming = new upcoming_model_1.UpcomingModel({
        title: data.title,
        type: data.type,
        trailerLink: data.trailerLink,
        details: data.details,
        releaseDate: data.releaseDate,
        active: data.active,
    });
    const photosDocs = await _a._uploadAndSavePostersToDB({
        landscapeFile: data.landscapePhoto,
        portraitFile: data.portraitPhoto,
        videoId: upcoming._id,
        posterParentType: 'upcoming',
    }, session);
    upcoming.landscapePhoto = photosDocs.landscape._id;
    upcoming.portraitPhoto = photosDocs.portrait._id;
    if (data.trailer) {
        _a._allowMimetype(data.trailer, 'video', 'trailer must be a video');
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: upcoming._id,
            parentType: 'upcoming',
        });
        const tVidUploadDoc = await _a._getVideoUploadDoc({
            file: data.trailer,
            expire: undefined,
            parentId: trailerDoc._id,
            parentType: 'trailer',
        }, session);
        trailerDoc.video_upload = tVidUploadDoc._id;
        upcoming.peviewTrailer = trailerDoc._id;
        await trailerDoc.save({ session });
    }
    await upcoming.save({ session });
    return upcoming;
};
UpcomingService.adminCreate = async (data) => {
    return (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createUpcomingWithSession, data);
};
UpcomingService.adminFetch = async (query) => {
    const upAggrRes = await UpcomingRepo_1.UpcomingRepo.fetchAggr({
        prevStages: [],
        page: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1),
        limit: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10),
    });
    return await UpcomingMediaSourceUtils_1.UpcomingMediaSourceUtils.resolveSources(upAggrRes, '1080p');
};
UpcomingService.customerFetch = async (query, currentUser) => {
    const [vidQuality, upAggrRes] = await Promise.all([
        VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '480p'),
        //
        await UpcomingRepo_1.UpcomingRepo.fetchAggr({
            prevStages: [{ $match: { active: true } }],
            page: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1),
            limit: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10),
        }),
    ]);
    return await UpcomingMediaSourceUtils_1.UpcomingMediaSourceUtils.resolveSources(upAggrRes, vidQuality);
};
UpcomingService.customerSubscription = async (currentUser, upcomingId, action) => {
    (0, denyGuestUser_1.denyGuestUser)(currentUser);
    const upcoming = await upcoming_model_1.UpcomingModel.findByIdAndUpdate(upcomingId, {
        [action === 'subscribe' ? '$addToSet' : '$pull']: {
            reminder: currentUser._id,
        },
    });
    if (upcoming === null) {
        throw new OperationalError_1.OperationalError('Upcoming not found', 404);
    }
};
UpcomingService.customerIsSubscribed = async (currentUser, upcomingId) => {
    (0, denyGuestUser_1.denyGuestUser)(currentUser);
    const upcoming = await upcoming_model_1.UpcomingModel.findOne({
        _id: upcomingId,
        reminder: currentUser.id,
    });
    return !!upcoming;
};
