import { SuggestionService } from '../../services/core/SuggestionService'
import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

export class AdminSuggestionController {
  static suggestionsAll = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await SuggestionService.getAdminSuggestions(query),
      message: 'suggestions all',
    })
  })

  static suggestionRead = Catch.async(async (req, res) => {
    await SuggestionService.adminReadSuggestionById(req.params.id)

    sendResponse({
      res,
      message: 'suggestion marked read',
    })
  })

  static suggestionDel = Catch.async(async (req, res) => {
    await SuggestionService.adminDeleteSuggestionById(req.params.id)

    sendResponse({
      res,
      message: 'suggestion deleted',
    })
  })
}
