"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastEnumRepo = void 0;
const castEnum_model_1 = require("../models/castEnum.model");
class CastEnumRepo {
}
exports.CastEnumRepo = CastEnumRepo;
CastEnumRepo.create = (name, title) => castEnum_model_1.CastEnumModel.create({ name, title });
CastEnumRepo.getAllCasts = () => castEnum_model_1.CastEnumModel.find({});
CastEnumRepo.deleteById = (id) => castEnum_model_1.CastEnumModel.findByIdAndDelete(id);
