"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const payments_model_1 = require("../../models/payments.model");
const wallet_model_1 = require("../../models/wallet.model");
const hide_1 = require("../../utils/hide");
class ClientProfileService {
}
exports.ClientProfileService = ClientProfileService;
_a = ClientProfileService;
ClientProfileService.clientsPaymentHis = async (currentUser) => {
    const wallHis = await payments_model_1.PaymentModel.find({ user_id: currentUser.id }).select('-__v');
    return wallHis;
};
ClientProfileService.fetchClientProfile = async (currentUser) => {
    const profile = (0, hide_1.hidePrivateProps)(currentUser);
    const photo_url = !profile.photo
        ? null
        : await media_access_1.MediaAccess.getSignedUrl(profile.photo.Bucket, profile.photo.Key, 'photo');
    profile.photo = undefined;
    const wallet = await wallet_model_1.WalletModel.findOne({ user_id: currentUser._id }).select('balance');
    Object.assign(profile, { wallet_bal: wallet?.balance ?? 0 });
    return {
        profile,
        photo_url,
    };
};
