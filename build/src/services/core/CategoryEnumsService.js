"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryEnumService = void 0;
const CategoryEnumRepo_1 = require("../../repositories/CategoryEnumRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const categoryEnum_model_1 = require("../../models/categoryEnum.model");
class CategoryEnumService {
}
exports.CategoryEnumService = CategoryEnumService;
_a = CategoryEnumService;
CategoryEnumService.addCategory = async (name, position) => {
    const category = await categoryEnum_model_1.CategoryEnumModel.create({
        name,
        position,
    });
    return category;
};
CategoryEnumService.updateCategory = async (catId, data) => {
    const updatedCategory = await categoryEnum_model_1.CategoryEnumModel.findByIdAndUpdate(catId, data, { new: true });
    if (updatedCategory == null) {
        throw new OperationalError_1.OperationalError('category id is invalid', 404);
    }
    return updatedCategory;
};
CategoryEnumService.getCategories = async (query) => {
    const features = new QueryParamsFeatures_1.QueryParamsFeatures(CategoryEnumRepo_1.CategoryEnumRepo.getAllCategories(), {
        defaultLimit: 300,
        defaultPage: 1,
        queryParams: query,
    });
    return await features.paginate().query;
};
CategoryEnumService.deleteCategoryById = async (categoryId) => {
    const deletedCategory = await CategoryEnumRepo_1.CategoryEnumRepo.deleteById(categoryId);
    if (deletedCategory == null) {
        throw new OperationalError_1.OperationalError('invalid categoryId', 404);
    }
};
