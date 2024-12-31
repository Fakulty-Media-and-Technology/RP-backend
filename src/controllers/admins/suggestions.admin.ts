import { SuggestionModel } from '../../models/suggestions.model'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown, skip } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class AdminSuggestionController {
  static suggestionsAll = Catch.async(async ({ query }, res) => {
    const limit = handleDefaultNumAndUnknown(query.limit, 10)
    const page = handleDefaultNumAndUnknown(query.page, 1)

    const suggestions = await SuggestionModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',

          pipeline: [
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
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip(page, limit),
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
    const updated = await SuggestionModel.findByIdAndUpdate(req.params.id, {
      seen: true,
    })

    if (updated == null) {
      throw new OperationalError('invalid ID', 404)
    }

    sendResponse({
      res,
      message: 'suggestion marked read',
    })
  })

  static suggestionDel = Catch.async(async (req, res) => {
    const deleted = await SuggestionModel.findByIdAndDelete(req.params.id)

    if (deleted == null) {
      throw new OperationalError('invalid ID', 404)
    }

    sendResponse({
      res,
      message: 'suggestion deleted',
    })
  })
}
