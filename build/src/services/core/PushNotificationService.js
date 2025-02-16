"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const userDevice_model_1 = require("../../models/userDevice.model");
class PushNotificationService {
}
exports.PushNotificationService = PushNotificationService;
_a = PushNotificationService;
PushNotificationService.setDeviceToken = async (currentUserId, data) => {
    const { device_token, device_id, device_type } = data;
    await userDevice_model_1.UserDeviceModel.create({
        user_id: currentUserId,
        device_id: device_id,
        device_token: device_token,
        device_type: device_type,
    });
};
PushNotificationService.updateDeviceToken = async (currentUserId, data) => {
    const { device_token, device_id, device_type } = data;
    const checkDevice = await userDevice_model_1.UserDeviceModel.findOne({
        user_id: currentUserId,
        device_token,
    });
    if (checkDevice) {
        return;
    }
    await userDevice_model_1.UserDeviceModel.findOneAndUpdate({
        user_id: currentUserId,
    }, {
        $set: {
            device_token,
            device_id,
            device_type,
        },
    });
};
