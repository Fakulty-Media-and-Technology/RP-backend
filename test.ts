import mongoose, { PipelineStage } from 'mongoose'
import { VideoModel } from './src/models/videos.model'
//
;(async () => {
  await mongoose.connect('mongodb://localhost:27017/reeplay')

  console.log('Connected')

  const aggr = await VideoModel.aggregate([
    { $match: { _id: toObjectId('67ad7667f0bbe0b770458aa9') } },

    {
      $lookup: {
        from: 'seasons',
        localField: '_id',
        foreignField: 'video',
        as: 'seasons',

        pipeline: [
          { $sort: { _id: -1 } },
          {
            $lookup: {
              from: 'episodes',
              localField: '_id',
              foreignField: 'season',
              as: 'episodes',
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: 'trailers',
        localField: '_id',
        foreignField: 'video_id',
        as: 'trailers',

        pipeline: [
          {
            $lookup: {
              from: 'video_uploads',
              localField: 'video_upload',
              foreignField: '_id',
              as: 'trailerVideUploads',
            },
          },

          {
            $project: {
              isTrailerVidUploadTranscoded: {
                $ifNull: [{ $first: '$trailerVideUploads.isTranscoded' }, null],
              },
            },
          },
        ],
      },
    },

    {
      $project: {
        totalPreviousSeasons: { $size: '$seasons' },
        totalEpisodesOfLastSeason: { $size: { $ifNull: [{ $first: '$seasons.episodes' }, 0] } },
        movieExpiryDate: { $ifNull: ['$expiry_date', undefined] },
        movieTrailerLink: { $ifNull: ['$trailerLink', null] },
        isMovieTrailerVidUploadTranscoded: {
          $ifNull: [{ $first: '$trailers.isTrailerVidUploadTranscoded' }, null],
        },
      },
    },
  ])

  console.log(JSON.stringify(aggr, null, 2))
  process.exit(0)
})()

function toObjectId(seasonId: string) {
  return new mongoose.Types.ObjectId(seasonId)
}

// interface RootObject {
//   _id: string
//   seasonTrailerLink: null
//   recentEpisodeTrailerLink: boolean
//   recentEpisodeVideoLink: boolean
//   isTrailerUploadVidTranscoded: boolean
//   isRecentEpisodeTrailerVidUploadTranscoded: boolean
//   isRecentEpisodeVidUploadTranscoded: boolean
//   totalPreviousEpisodes: number
// }
