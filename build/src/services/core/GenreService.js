"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreService = void 0;
const GenreRepo_1 = require("../../repositories/GenreRepo");
const OperationalError_1 = require("../../utils/OperationalError");
class GenreService {
}
exports.GenreService = GenreService;
_a = GenreService;
GenreService.create = async (name) => {
    await GenreRepo_1.GenreRepo.create(name);
};
GenreService.getGenres = async () => {
    return await GenreRepo_1.GenreRepo.getAllGenres();
};
GenreService.deleteGenreByNameOrId = async (type, val) => {
    const deletedGenre = await GenreRepo_1.GenreRepo.deleteGenre(type, val);
    if (deletedGenre === null) {
        throw new OperationalError_1.OperationalError('Invalid genre', 404);
    }
};
