import { SuggestionModel } from '../../models/suggestions.model'
import { SuggestionRepo } from '../../repositories/SuggestionRepo'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

export class SuggestionService {
  static getAdminSuggestions = async (query: ExpressRequestQuery) => {
    const { limit, skip } = QueryParamsFeatures.paginagteParams(query)
    const suggestions = await SuggestionRepo.adminAllSuggestions(skip, limit)
    return suggestions
  }

  static adminReadSuggestionById = async (suggestionId: string) => {
    const updated = await SuggestionModel.findByIdAndUpdate(suggestionId, {
      seen: true,
    })

    if (updated == null) {
      throw new OperationalError('invalid ID', 404)
    }
  }

  static adminDeleteSuggestionById = async (suggestionId: string) => {
    const deleted = await SuggestionModel.findByIdAndDelete(suggestionId)

    if (deleted == null) {
      throw new OperationalError('invalid ID', 404)
    }
  }
}
