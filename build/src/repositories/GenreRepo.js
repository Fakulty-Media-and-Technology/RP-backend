"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreRepo = void 0;
const genreEnum_model_1 = require("../models/genreEnum.model");
class GenreRepo {
}
exports.GenreRepo = GenreRepo;
GenreRepo.create = ({ name, position }) => genreEnum_model_1.GenreEnumModel.create({ name, position });
GenreRepo.getAllGenres = () => genreEnum_model_1.GenreEnumModel.find({});
GenreRepo.deleteGenre = (type, val) => {
    return genreEnum_model_1.GenreEnumModel.findOneAndDelete({ [type]: val });
};
