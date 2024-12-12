import { PosterImageModel } from '../models/poster.model'

export class PosterImageRepo {
  static findByVideoId = (vidId: string) => PosterImageModel.findOne({ video_id: vidId })
}
