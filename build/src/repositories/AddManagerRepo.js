"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdManagerRepo = void 0;
const admanager_model_1 = require("../models/admanager.model");
class AdManagerRepo {
}
exports.AdManagerRepo = AdManagerRepo;
AdManagerRepo.create = (data) => admanager_model_1.AdmanagerModel.create(data);
AdManagerRepo.deletedAdd = (addId) => admanager_model_1.AdmanagerModel.findByIdAndDelete(addId);
AdManagerRepo.getAdds = () => admanager_model_1.AdmanagerModel.find({});
