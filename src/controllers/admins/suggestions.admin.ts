import { SuggestionModel } from '../../models/suggestions.model'
import { Catch } from '../../utils/catchAsync'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class AdminSuggestionController {
  static suggestionsAll = Catch.async(async ({ query }, res) => {
    const limit = handleDefaultNumAndUnknown(query.limit, 10)
    const page = handleDefaultNumAndUnknown(query.page, 1)

    const suggestions = await SuggestionModel.aggregate([
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
        $skip: (page - 1) * limit || 0,
      },
      {
        $limit: limit,
      },
    ])

    sendResponse({
      res,
      data: suggestions,
      message: 'suggestions all',
    })
  })

  static suggestionRead = Catch.async(async (req, res) => {
    const id = req.params.id

    await SuggestionModel.findByIdAndUpdate(id, {
      seen: true,
    })

    sendResponse({
      res,
      message: 'suggestion marked read',
    })
  })

  static suggestionDel = Catch.async(async (req, res) => {
    const id = req.params.id

    await SuggestionModel.findOneAndDelete({
      _id: id,
    })

    sendResponse({
      res,
      message: 'suggestion deleted',
    })
  })
}
