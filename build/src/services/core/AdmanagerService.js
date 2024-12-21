"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdManagerService = void 0;
const admanager_model_1 = require("../../models/admanager.model");
const AddManagerRepo_1 = require("../../repositories/AddManagerRepo");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class AdManagerService {
}
exports.AdManagerService = AdManagerService;
_a = AdManagerService;
// TODO: Get the types for body
AdManagerService.addAd = async (body) => {
    const { title, sub_title, type, brand, photo, link, duration, start, expiry, active } = body;
    const ad = await AddManagerRepo_1.AdManagerRepo.create({
        title,
        sub_title,
        type,
        brand,
        photo,
        link,
        duration,
        start,
        expiry,
        active,
    });
    return ad;
};
AdManagerService.getAds = async (query) => {
    const queryFeatures = new QueryParamsFeatures_1.QueryParamsFeatures(AddManagerRepo_1.AdManagerRepo.getAdds(), {
        queryParams: query,
        defaultLimit: 10,
        defaultPage: 1,
    });
    const ads = await queryFeatures.query.sort({ createdAt: -1 });
    return ads;
};
AdManagerService.deleteAd = async (addId) => await admanager_model_1.AdmanagerModel.findByIdAndDelete(addId);
