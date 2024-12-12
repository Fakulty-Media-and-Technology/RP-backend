import { VideoModel } from '../models/videos.model'

export class VideoRepo {
  static findByType = (type: string) => VideoModel.find({ type })
}
