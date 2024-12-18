"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnumController = void 0;
const CastEnumService_1 = require("../../services/core/CastEnumService");
const CategoryEnumsService_1 = require("../../services/core/CategoryEnumsService");
const GenreService_1 = require("../../services/core/GenreService");
const catchAsync_1 = require("../../utils/catchAsync");
const responder_1 = require("../../utils/responder");
class AdminEnumController {
}
exports.AdminEnumController = AdminEnumController;
_a = AdminEnumController;
// *************** Genres
AdminEnumController.remGenre = catchAsync_1.Catch.async(async ({ params: { id } }, res) => {
    await GenreService_1.GenreService.deleteGenreByNameOrId('_id', id);
    (0, responder_1.sendResponse)({
        res,
        message: 'genre deleted',
    });
});
AdminEnumController.getGenres = catchAsync_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await GenreService_1.GenreService.getGenres(),
        message: 'new unique genre added',
    });
});
AdminEnumController.addGenre = catchAsync_1.Catch.async(async ({ body: { name } }, res) => {
    await GenreService_1.GenreService.create(name);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique genre added',
    });
});
// ********** Category *******
AdminEnumController.addCategory = catchAsync_1.Catch.async(async ({ body: { name } }, res) => {
    await CategoryEnumsService_1.CategoryEnumService.addCategory(name);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique category added',
    });
});
AdminEnumController.getCategory = catchAsync_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CategoryEnumsService_1.CategoryEnumService.getCategories(),
        message: 'categories fetched',
    });
});
AdminEnumController.remCategory = catchAsync_1.Catch.async(async ({ params: { id } }, res) => {
    await CategoryEnumsService_1.CategoryEnumService.deleteCategoryById(id);
    (0, responder_1.sendResponse)({
        res,
        message: 'category deleted',
    });
});
// *************** Casts
AdminEnumController.addCast = catchAsync_1.Catch.async(async ({ body: { name, title } }, res) => {
    await CastEnumService_1.CastEnumService.createCast(name, title);
    (0, responder_1.sendResponse)({
        res,
        message: 'new unique cast added',
    });
});
AdminEnumController.getCast = catchAsync_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'casts fetched',
        data: await CastEnumService_1.CastEnumService.getCasts(),
    });
});
AdminEnumController.remcast = catchAsync_1.Catch.async(async ({ params: { id } }, res) => {
    await CastEnumService_1.CastEnumService.deleteById(id);
    (0, responder_1.sendResponse)({
        res,
        message: 'cast deleted',
    });
});
