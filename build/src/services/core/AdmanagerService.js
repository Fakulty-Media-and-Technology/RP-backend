"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdManagerService = void 0;
const admanager_model_1 = require("../../models/admanager.model");
const AddManagerRepo_1 = require("../../repositories/AddManagerRepo");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const OperationalError_1 = require("../../utils/OperationalError");
class AdManagerService {
}
exports.AdManagerService = AdManagerService;
_a = AdManagerService;
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
    const queryFeatures = new QueryParamsFeatures_1.QueryParamsFeatures(AddManagerRepo_1.AdManagerRepo.getAdds().sort({ createdAt: -1 }), {
        queryParams: query,
        defaultLimit: 10,
        defaultPage: 1,
    });
    return await queryFeatures.paginate().query;
};
AdManagerService.deleteAd = async (addId) => {
    const deleted = await admanager_model_1.AdmanagerModel.findByIdAndDelete(addId);
    if (deleted == null) {
        throw new OperationalError_1.OperationalError('invalid add Id', 404);
    }
};
