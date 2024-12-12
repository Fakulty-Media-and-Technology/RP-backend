const LivesModel = require('../../models/lives.model')
const VideosModel = require('../../models/videos.model')
const {
  serverError,
  successResponse,
  failedResponse,
  invalidRequest,
} = require('../../utils/responder.ts')

// exports.getContents = async (req, res) => {
//      try {
//           const vods = await VideosModel.aggregate([
//                {
//                     $match: {},
//                },
//           ]);

//           const events = await LivesModel.aggregate([
//                {
//                     $match: {
//                          $expr: {
//                               $and: [
//                                    {
//                                         $eq: ["$expired", false],
//                                    },
//                                    {
//                                         $eq: ["$active", true],
//                                    },
//                               ],
//                          },
//                     },
//                },
//           ]);

//           return successResponse(
//                res,
//                200,
//                {
//                     vods_contents: vods,
//                     lives_contents: events,
//                },
//                "contents fetched successful"
//           );
//      } catch (error) {
//           return serverError(res, 500, null, error.message);
//      }
// };

exports.searchContents = async (req, res) => {
  try {
    const { text } = req.query

    const vods = await VideosModel.aggregate([
      {
        $match: {
          $or: [
            {
              title: {
                $regex: text,
                $options: 'i',
              },
            },
            {
              description: {
                $regex: text,
                $options: 'i',
              },
            },
          ],
        },
      },
    ])

    const events = await LivesModel.aggregate([
      {
        $match: {
          $or: [
            {
              title: {
                $regex: text,
                $options: 'i',
              },
            },
            {
              sub_title: {
                $regex: text,
                $options: 'i',
              },
            },
            {
              description: {
                $regex: text,
                $options: 'i',
              },
            },
          ],
        },
      },
    ])

    return successResponse(
      res,
      200,
      {
        vods_contents: vods,
        lives_contents: events,
      },
      'contents fetched successful',
    )
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.addToFeatured = async (req, res) => {
  try {
    const { type, id, expiry } = req.body //type = vod/event

    if (!['vod', 'event'].includes(type)) {
      return failedResponse(res, 400, null, "type of content must be specified 'vod or event'")
    }

    if (!type || !id || !expiry) {
      return invalidRequest(res, 400, null, 'all inputs are required')
    }

    if (type === 'vod') {
      await VideosModel.findOneAndUpdate(
        {
          _id: id,
        },
        {
          featured: true,
          feat_expiry: new Date(expiry),
        },
        {
          upsert: true,
        },
      )

      return successResponse(res, 200, null, 'VOD content added to featured')
    }

    await LivesModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        featured: true,
        feat_expiry: new Date(expiry),
      },
      {
        upsert: true,
      },
    )

    return successResponse(res, 200, null, 'live event content added to featured')
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}

exports.getFeaturedContents = async (req, res) => {
  try {
    const vods = await VideosModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$featured', true],
          },
        },
      },
    ])

    const events = await LivesModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ['$featured', true],
              },
              {
                $eq: ['$expired', false],
              },
              //    {
              //         $eq: ["$active", true],
              //    },
            ],
          },
        },
      },
    ])

    return successResponse(
      res,
      200,
      {
        vods_contents: vods,
        lives_contents: events,
      },
      'contents fetched successful',
    )
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}
