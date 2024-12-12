const SuggestionsModel = require('../../models/suggestions.model')
const {
  serverError,
  successResponse,
  failedResponse,
  invalidRequest,
} = require('../../utils/response.handler')

exports.suggestionsAll = async (req, res) => {
  try {
    const limit = req.query.limit || 10
    const page = req.query.page || 1

    const suggestions = await SuggestionsModel.aggregate([
      {
        $match: {
          $expr: {},
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            uid: '$user_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id',
                    {
                      $toObjectId: '$$uid',
                    },
                  ],
                },
              },
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                photo: 1,
                email: 1,
                country_code: 1,
                mobile: 1,
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: Number(page - 1) * Number(limit) || 0,
      },
      {
        $limit: Number(limit),
      },
    ])

    return successResponse(res, 200, suggestions, 'suggestions all')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}

exports.suggestionRead = async (req, res) => {
  try {
    const id = req.params.id

    await SuggestionsModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        seen: true,
      },
    )

    return successResponse(res, 200, null, 'suggestion marked read')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}

exports.suggestionDel = async (req, res) => {
  try {
    const id = req.params.id

    await SuggestionsModel.findOneAndDelete({
      _id: id,
    })

    return successResponse(res, 200, null, 'suggestion deleted')
  } catch (error) {
    return serverError(res, 400, null, error.message)
  }
}
