"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreService = void 0;
const GenreRepo_1 = require("../../repositories/GenreRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class GenreService {
}
exports.GenreService = GenreService;
_a = GenreService;
GenreService.create = async (name, position) => {
    await GenreRepo_1.GenreRepo.create({
        name,
        position
    });
};
GenreService.getGenres = async (query) => {
    const features = new QueryParamsFeatures_1.QueryParamsFeatures(GenreRepo_1.GenreRepo.getAllGenres(), {
        defaultLimit: 300,
        defaultPage: 1,
        queryParams: query,
    });
    return await features.paginate().query;
};
GenreService.deleteGenreByNameOrId = async (type, val) => {
    const deletedGenre = await GenreRepo_1.GenreRepo.deleteGenre(type, val);
    if (deletedGenre === null) {
        throw new OperationalError_1.OperationalError('Invalid genre', 404);
    }
};
