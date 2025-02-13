import multer from 'multer'

import { Bytes } from './Bytes'
import { OperationalError } from './OperationalError'
import { Assets } from './Assets'
import { genRandUniqId } from './strGen'

export class Multer {
  private static _configs = {
    videConfig: multer({
      storage: multer.diskStorage({
        destination: Assets.rootMediaDirs.multer,

        filename: (_, file, cb) => {
          cb(null, genRandUniqId(5) + '_' + file.originalname)
        },
      }),

      limits: { fieldSize: Bytes.gb(20) },

      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('video')) {
          cb(new OperationalError('Only video file is allowed', 400))
          return
        }

        cb(null, true)
      },
    }),

    imageConfig: multer({
      storage: multer.memoryStorage(),

      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image')) {
          cb(new OperationalError('Only image file is allowed', 400))
          return
        }

        cb(null, true)
      },
    }),

    subtitleConfig: multer({
      storage: multer.memoryStorage(),
    }),
  }

  static uploadSingleImage = this._configs.imageConfig.single('photo')
  static uploadSingleVideo = this._configs.videConfig.single('video')
  static uploadSingleSubtitle = this._configs.subtitleConfig.single('subtitle')

  static adminUploadVideoConfig = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'subTitle', maxCount: 1 },
    { name: 'trailer', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'landscapePoster', maxCount: 1 },
    { name: 'portraitPoster', maxCount: 1 },
  ])

  static adminUploadSeasonConfig = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'trailer', maxCount: 1 },
    { name: 'portraitPhoto', maxCount: 1 },
    { name: 'landscapePhoto', maxCount: 1 },
  ])

  static createLiveConfig = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'previewVideo', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 },
  ])

  static createUpcomingConfig = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'portraitPhoto', maxCount: 1 },
    { name: 'landscapePhoto', maxCount: 1 },
    { name: 'trailer', maxCount: 1 },
  ])
}
