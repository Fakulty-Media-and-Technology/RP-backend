"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminSuggestionsRouter = void 0;
const express_1 = require("express");
const suggestions_admin_1 = require("../../controllers/admins/suggestions.admin");
exports.superAdminSuggestionsRouter = (0, express_1.Router)();
exports.superAdminSuggestionsRouter.get('/all', suggestions_admin_1.AdminSuggestionController.suggestionsAll);
exports.superAdminSuggestionsRouter.put('/markread/:id', suggestions_admin_1.AdminSuggestionController.suggestionRead);
exports.superAdminSuggestionsRouter.delete('/del/:id', suggestions_admin_1.AdminSuggestionController.suggestionDel);
