"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryEnumService = void 0;
const CategoryEnumRepo_1 = require("../../repositories/CategoryEnumRepo");
const OperationalError_1 = require("../../utils/OperationalError");
class CategoryEnumService {
}
exports.CategoryEnumService = CategoryEnumService;
_a = CategoryEnumService;
CategoryEnumService.addCategory = async (name) => {
    return await CategoryEnumRepo_1.CategoryEnumRepo.create(name);
};
CategoryEnumService.getCategories = async () => {
    return await CategoryEnumRepo_1.CategoryEnumRepo.getAllCategories();
};
CategoryEnumService.deleteCategoryById = async (categoryId) => {
    const deletedCategory = await CategoryEnumRepo_1.CategoryEnumRepo.deleteById(categoryId);
    if (deletedCategory == null) {
        throw new OperationalError_1.OperationalError('invalid categoryId', 404);
    }
};
