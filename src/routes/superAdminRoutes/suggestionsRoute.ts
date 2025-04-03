import { Router } from 'express'
import { AdminSuggestionController } from '../../controllers/admins/suggestions.admin'

export const superAdminSuggestionsRouter = Router()

superAdminSuggestionsRouter.get('/all', AdminSuggestionController.suggestionsAll)
superAdminSuggestionsRouter.put('/markread/:id', AdminSuggestionController.suggestionRead)
superAdminSuggestionsRouter.delete('/del/:id', AdminSuggestionController.suggestionDel)
