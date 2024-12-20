import multer from 'multer'

import { Bytes } from './Bytes'
import { OperationalError } from './OperationalError'
import { Assets } from './Assets'

export class Multer {
  private static _configs = {
    videConfig: multer({
      storage: multer.diskStorage({
        destination: Assets.rootMediaDirs.multer,

        filename: (_, file, cb) => {
          cb(null, file.originalname)
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
}
