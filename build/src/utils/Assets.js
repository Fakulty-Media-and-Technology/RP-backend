"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assets = void 0;
const node_path_1 = require("node:path");
class Assets {
}
exports.Assets = Assets;
Assets.rootMediaDirs = {
    multer: (0, node_path_1.resolve)('tempMedia'),
    nodeMediaServer: (0, node_path_1.resolve)('media'),
};
Assets.modelNames = {
    admanagers: 'admanagers',
    castEnums: 'cast_enums',
    categoryEnums: 'category_enums',
    genreEnums: 'genre_enums',
    comments: 'comments',
    contestants: 'contestants',
    donates: 'donates',
    episodes: 'episodes',
    featured: 'Featured',
    giftCards: 'giftcards',
    seasons: 'seasons',
    trailers: 'trailer',
    videoUploads: 'video_uploads',
    lives: 'lives',
    notifications: 'notifications',
    payments: 'payments',
    paymentDetails: 'payment_details',
    posterImages: 'poster_images',
    users: 'users',
    ratings: 'ratings',
    subscriptions: 'subscriptions',
    suggestions: 'suggestions',
    subtitles: 'sub_titles',
    settings: 'settings',
    plans: 'plans',
    payouts: 'payouts',
    upcomings: 'upcomings',
    userDevices: 'userdevices',
    votes: 'votes',
    video: 'Video',
    voteInfo: 'voteinfos',
    wallet: 'wallets',
};
