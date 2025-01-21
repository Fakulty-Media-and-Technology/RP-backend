import { resolve } from 'node:path'

export class Assets {
  static rootMediaDirs = {
    multer: resolve('tempMedia'),
    nodeMediaServer: resolve('media'),
  }

  static modelNames = {
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
  }
}
