"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnumController = void 0;
const CastEnumService_1 = require("../../services/core/CastEnumService");
const CategoryEnumsService_1 = require("../../services/core/CategoryEnumsService");
const GenreService_1 = require("../../services/core/GenreService");
const Catch_1 = require("../../utils/Catch");
const responder_1 = require("../../utils/responder");
class AdminEnumController {
}
exports.AdminEnumController = AdminEnumController;
_a = AdminEnumController;
// *************** Genres
AdminEnumController.remGenre = Catch_1.Catch.async(async ({ params: { id } }, res) => {
    await GenreService_1.GenreService.deleteGenreByNameOrId('_id', id);
    (0, responder_1.sendResponse)({
        res,
        message: 'genre deleted',
    });
});
AdminEnumController.getGenres = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await GenreService_1.GenreService.getGenres(req.query),
        message: 'generes fetched',
    });
});
AdminEnumController.addGenre = Catch_1.Catch.async(async ({ body: { name, position } }, res) => {
    await GenreService_1.GenreService.create(name, position);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique genre added',
    });
});
// ********** Category *******
AdminEnumController.addCategory = Catch_1.Catch.async(async ({ body: { name, position } }, res) => {
    await CategoryEnumsService_1.CategoryEnumService.addCategory(name, position);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique category added',
    });
});
AdminEnumController.getCategory = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CategoryEnumsService_1.CategoryEnumService.getCategories(req.query),
        message: 'categories fetched',
    });
});
AdminEnumController.updateCategory = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CategoryEnumsService_1.CategoryEnumService.updateCategory(req.params.catId, req.body),
        message: 'category updated',
    });
});
AdminEnumController.remCategory = Catch_1.Catch.async(async ({ params: { id } }, res) => {
    await CategoryEnumsService_1.CategoryEnumService.deleteCategoryById(id);
    (0, responder_1.sendResponse)({
        res,
        message: 'category deleted',
    });
});
// *************** Casts
AdminEnumController.addCast = Catch_1.Catch.async(async ({ body: { name, title } }, res) => {
    await CastEnumService_1.CastEnumService.createCast(name, title);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique cast added',
    });
});
AdminEnumController.getCast = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'casts fetched',
        data: await CastEnumService_1.CastEnumService.getCasts(req.query),
    });
});
AdminEnumController.remcast = Catch_1.Catch.async(async ({ params: { id } }, res) => {
    await CastEnumService_1.CastEnumService.deleteById(id);
    (0, responder_1.sendResponse)({
        res,
        message: 'cast deleted',
    });
});
