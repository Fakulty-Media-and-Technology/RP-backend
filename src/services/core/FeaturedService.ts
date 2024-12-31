import { OperationalError } from '../../utils/OperationalError'
import { VideoService } from './VideoService'

type AddFeaturedInput = {
  type: 'vod' | 'event'
  id: string
  expiry: string
}

export class FeaturedService {
  static searchVideosByText = async (text: string) => {
    const [vods, events] = await Promise.all([
      VideoService.searceByText(text),
      VideoService.Live.searchByText(text),
    ])

    return { vods, events }
  }

  static addFeatured = async ({ id, type, expiry }: AddFeaturedInput) => {
    const newFeatured =
      type === 'vod'
        ? await VideoService.addFeatured(id, expiry)
        : await VideoService.Live.addFeatured(id, expiry)

    if (newFeatured === null) {
      throw new OperationalError('Invalid Id', 404)
    }
  }

  static getFeaturedContents = async () => {
    const [vods, events] = await Promise.all([
      VideoService.getFeaturedVideos(),
      VideoService.Live.getFeatured(),
    ])

    return {
      vods_contents: vods,
      lives_contents: events,
    }
  }
}
