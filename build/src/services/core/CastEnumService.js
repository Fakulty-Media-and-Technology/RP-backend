"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastEnumService = void 0;
const CastEnumRepo_1 = require("../../repositories/CastEnumRepo");
const OperationalError_1 = require("../../utils/OperationalError");
class CastEnumService {
}
exports.CastEnumService = CastEnumService;
_a = CastEnumService;
CastEnumService.createCast = async (name, title) => {
    return await CastEnumRepo_1.CastEnumRepo.create(name, title);
};
CastEnumService.getCasts = async () => {
    return await CastEnumRepo_1.CastEnumRepo.getAllCasts();
};
CastEnumService.deleteById = async (castId) => {
    const deletedCast = await CastEnumRepo_1.CastEnumRepo.deleteById(castId);
    if (deletedCast == null) {
        throw new OperationalError_1.OperationalError('invalid cast Id', 404);
    }
};
