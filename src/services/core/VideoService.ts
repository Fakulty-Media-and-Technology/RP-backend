import { VideoRepo } from '../../repositories/VideoRepo'
import { LiveService } from './LiveService'

export class VideoService {
  static Live = LiveService

  static searceByText = async (text: string) =>
    await VideoRepo.searchTitleOrDescriptionByTextReg(new RegExp(text, 'i'))

  static addFeatured = async (id: string, expiry: string) => await VideoRepo.addFeatured(id, expiry)

  static getFeaturedVideos = async () => await VideoRepo.getFeatured()
}
