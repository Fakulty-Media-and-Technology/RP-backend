import { MediaAccess } from '../services/media-access'
import { Episode, GetVideoSourceParams, Movie, Season } from '../types/movie'
import { OperationalError } from './OperationalError'

export class MovieMediaSourcesUtils {
  public static getMovieVideoSource = (vid: GetVideoSourceParams, routine: 'vid' | 'trailer') => {
    switch (routine) {
      case 'vid':
        if (vid.videoLink) {
          return vid.videoLink
        }

        if (vid.videoUpload) {
          const resolution1080 = vid.videoUpload.resolutions.find(r => r.resolution === '1080')
          if (resolution1080 == null) return null
          return MediaAccess.getCloudFrontSignedUrl(resolution1080.key)
        }

        return null
      case 'trailer':
        if (vid.trailerLink) {
          return vid.trailerLink
        }

        if (vid.trailerVideoUpload) {
          const resolution1080 = vid.trailerVideoUpload.resolutions.find(
            r => r.resolution === '1080',
          )

          if (resolution1080 == null) return null

          return MediaAccess.getCloudFrontSignedUrl(resolution1080.key)
        }
        return null

      default:
        throw new OperationalError('invalid getVideoSource routine', 500)
    }
  }

  public static resolveSeasonsMediaSources = async (
    seasons: Season[],
    withMediaSources: boolean,
    episodesMediaResolver?: (e: Episode[], withMediaSources: boolean) => Promise<Episode[]>,
  ) => {
    const seasonsWithSources = await Promise.all(
      seasons.map(async season => {
        // process trailerLink and trailervideoUpload

        if (episodesMediaResolver) {
          season.episodes = await episodesMediaResolver(season.episodes, withMediaSources)
        }

        return season
      }),
    )

    return seasonsWithSources as Season[]
  }
  public static resolveEpisodesMediaSources = async (
    episodes: Episode[],
    withMediaSources: boolean,
  ) => {
    const episodesWithSources = await Promise.all(
      episodes.map(async episode => {
        const res: Record<string, any> = {
          ...episode,
        }

        if (withMediaSources) {
          res.trailerVideoUpload = undefined
          res.videoUpload = undefined
          res.mediaSources = {
            videoSource: this.getMovieVideoSource(episode, 'vid'),
            trailerSource: this.getMovieVideoSource(episode, 'trailer'),
            subtitleSource: episode.subtitle
              ? await MediaAccess.getSignedUrl(
                  episode.subtitle.bucket,
                  episode.subtitle.key,
                  'subtitle',
                )
              : null,
          }

          res.subtitle = undefined
        }

        return res
      }),
    )

    return episodesWithSources as unknown as Episode[]
  }

  private static _getMoviePhotos = async (vid: Movie) => {
    const [landscapePhoto, portraitPhoto] = await Promise.all([
      MediaAccess.getSignedUrl(vid.landscapePhoto.bucket, vid.landscapePhoto.key, 'photo'),
      MediaAccess.getSignedUrl(vid.portraitPhoto.bucket, vid.portraitPhoto.key, 'photo'),
    ])

    return { landscapePhoto, portraitPhoto }
  }

  public static resolveMovieMediaSources = async (vids: Movie[], withMediaSources = true) => {
    return await Promise.allSettled(
      vids.map(async vid => {
        const { landscapePhoto, portraitPhoto } = await this._getMoviePhotos(vid)

        vid.seasons = await MovieMediaSourcesUtils.resolveSeasonsMediaSources(
          vid.seasons,
          withMediaSources,
          MovieMediaSourcesUtils.resolveEpisodesMediaSources,
        )

        const res: Record<string, any> = {
          ...vid,
          landscapePhoto,
          portraitPhoto,
        }

        if (withMediaSources) {
          res.trailerVideoUpload = undefined
          res.videoUpload = undefined

          res.mediaSources = {
            videoSource: this.getMovieVideoSource(vid, 'vid'),
            trailerSource: this.getMovieVideoSource(vid, 'trailer'),
            subtitleSource: vid.subtitle
              ? await MediaAccess.getSignedUrl(vid.subtitle.bucket, vid.subtitle.key, 'subtitle')
              : null,
          }

          res.subtitle = undefined
        }

        return res
      }),
    )
  }
}
