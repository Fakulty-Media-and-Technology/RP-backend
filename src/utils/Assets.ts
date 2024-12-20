import { resolve } from 'node:path'

export class Assets {
  static rootMediaDirs = {
    multer: resolve('tempMedia'),
    nodeMediaServer: resolve('media'),
  }
}
