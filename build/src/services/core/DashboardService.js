"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const LiveRepo_1 = require("../../repositories/LiveRepo");
const SubscriptionRepo_1 = require("../../repositories/SubscriptionRepo");
const UserRepo_1 = require("../../repositories/UserRepo");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const WalletRepo_1 = require("../../repositories/WalletRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const Password_1 = require("../../utils/Password");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const media_management_1 = require("../media-management");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const AdminUploadService_1 = require("./AdminUploadService");
function isValidEmail(email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
}
class DashboardService {
}
exports.DashboardService = DashboardService;
_a = DashboardService;
DashboardService.getCurrentAdminProfile = async (adminId) => {
    const admin = await UserRepo_1.UserRepo.getAdminById(adminId);
    if (admin == null) {
        throw new OperationalError_1.OperationalError('invalid admin', 403);
    }
    return admin;
};
// TODO: update the type for data
DashboardService.editAdminProfile = async (currentUser, data) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        throw new OperationalError_1.OperationalError('current user is not an admin', 403);
    }
    const { first_name, last_name, country_code, mobile, photo, email, password } = data;
    if (email) {
        if (!isValidEmail(email)) {
            throw new OperationalError_1.OperationalError('invalid email format', 400);
        }
        if (await UserRepo_1.UserRepo.getByEmail(email)) {
            throw new OperationalError_1.OperationalError('Email already in use', 409);
        }
    }
    if (photo) {
        if (currentUser.photo)
            await media_management_1.MediaManagement.deleteObject(currentUser.photo.Key, currentUser.photo.Bucket);
        currentUser.photo = photo;
    }
    await UserRepo_1.UserRepo.updateById(currentUser.id, {
        email: email ? email : currentUser.email,
        password: password ? await Password_1.Password.encrypt(password) : currentUser.password,
        first_name: first_name ? first_name : currentUser.first_name,
        last_name: last_name ? last_name : currentUser.last_name,
        country_code: country_code ? country_code : currentUser.country_code,
        mobile: mobile ? mobile : currentUser.mobile,
        photo: photo ? photo : currentUser.photo,
    });
};
DashboardService.fetchVideosByType = async (type, queryParams) => {
    if (typeof type !== 'string') {
        throw new OperationalError_1.OperationalError('invalid or missing type', 400);
    }
    const vids = await VideoRepo_1.VideoRepo.fetchByType(type, (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.limit, 10));
    return await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(vids, AdminUploadService_1.AdminUploadService.resolveWithMediaSources(queryParams), '720p');
};
DashboardService.fetchChannels = async (query) => {
    return await LiveRepo_1.LiveRepo.getChannels((0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10));
};
DashboardService.fetchBalanceAndUser = async () => {
    const [totBal, totUsers, activeSubscriptions, freeeUsers] = await Promise.all([
        WalletRepo_1.WalletRepo.totalBalance(),
        UserRepo_1.UserRepo.totalUsersCount(),
        SubscriptionRepo_1.SubscriptionRepo.activeSubs(new Date()),
        UserRepo_1.UserRepo.getFreeUsers(),
    ]);
    return {
        totUsers,
        activeSubscriptions,
        totalBalance: totBal[0] ?? 0,
        freeUsers: freeeUsers.length,
    };
};
DashboardService.totalContentsAndChunks = async () => {
    const [totalVideos, totalMovieSeries, totalMusicVideos, totalSkits, totalActiveEvents] = await Promise.all([
        VideoRepo_1.VideoRepo.totalVideosCountQuery(),
        VideoRepo_1.VideoRepo.totalMovieSeriesCountQuery(),
        VideoRepo_1.VideoRepo.totalMusicVideosCountQuery(),
        VideoRepo_1.VideoRepo.totalSkitVideosCOuntQuery(),
        LiveRepo_1.LiveRepo.totalActiveLiveQuery().countDocuments(),
    ]);
    return {
        totalSkits,
        totalMovieSeries,
        totalMusicVideos,
        totalActiveEvents,
        totalContents: totalVideos + totalActiveEvents,
    };
};
