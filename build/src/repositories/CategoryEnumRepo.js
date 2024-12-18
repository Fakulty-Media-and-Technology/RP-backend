"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryEnumRepo = void 0;
const categoryEnum_model_1 = require("../models/categoryEnum.model");
class CategoryEnumRepo {
}
exports.CategoryEnumRepo = CategoryEnumRepo;
CategoryEnumRepo.create = (name) => categoryEnum_model_1.CategoryEnumModel.create({ name });
CategoryEnumRepo.getAllCategories = () => categoryEnum_model_1.CategoryEnumModel.find({});
CategoryEnumRepo.deleteById = (id) => categoryEnum_model_1.CategoryEnumModel.findByIdAndDelete(id);
