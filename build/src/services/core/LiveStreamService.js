"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamService = void 0;
const env_1 = __importDefault(require("../../env"));
const lives_model_1 = require("../../models/lives.model");
const payments_model_1 = require("../../models/payments.model");
const OperationalError_1 = require("../../utils/OperationalError");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const live_1 = require("../../utils/live");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
const VideoUploadUtils_1 = require("../../utils/VideoUploadUtils");
class LiveStreamService {
}
exports.LiveStreamService = LiveStreamService;
_a = LiveStreamService;
LiveStreamService._extendLiveEventWithSession = async ({ currentUser, data }, session) => {
    const { id: client_id } = currentUser;
    const { live_id, new_expiry, payment_id } = data;
    if (!payment_id || !new_expiry || !live_id) {
        throw new OperationalError_1.OperationalError('all important fields are required', 400);
    }
    const confirmPayment = await payments_model_1.PaymentModel.findOne({
        _id: payment_id,
        user_id: client_id,
        status: 'success',
        is_used: false,
    });
    if (!confirmPayment) {
        throw new OperationalError_1.OperationalError('your payment is invalid', 400);
    }
    const liveEvent = await lives_model_1.LiveModel.findOne({
        _id: live_id,
        client_id: client_id,
        active: true,
    });
    if (!liveEvent) {
        throw new OperationalError_1.OperationalError('event not found or not active', 400);
    }
    if (liveEvent.expiry == null) {
        throw new OperationalError_1.OperationalError('live event has no expiry', 400);
    }
    if (confirmPayment.amount !== (0, live_1.calcLiveCharges)(liveEvent.expiry.toISOString(), new_expiry)) {
        throw new OperationalError_1.OperationalError('payment made does not match charges', 400);
    }
    await lives_model_1.LiveModel.findOneAndUpdate({
        _id: live_id,
        client_id: client_id,
    }, {
        expiry: new Date(new_expiry),
        extpayment_id: confirmPayment._id,
    }, { session });
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: confirmPayment._id,
    }, {
        is_used: true,
        use_case: 'live schedule ext',
    }, {
        session,
    });
};
// ************** Public ************88
LiveStreamService.calcEventCharges = (start, expiry) => {
    if (typeof start !== 'string' || typeof expiry !== 'string') {
        throw new OperationalError_1.OperationalError('start and expirey must be strings', 400);
    }
    return {
        estimated_cost: (0, live_1.calcLiveCharges)(start, expiry),
    };
};
LiveStreamService.getLiveStreamCredentials = async (currentUser) => {
    const vidQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '720p');
    const lives = await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getValidClientLive(currentUser._id.toString()), vidQuality);
    return await Promise.all(lives.map(async (live) => {
        const signed = `?sign=${(0, live_1.signCred)(live.stream_key || '', live.expiry)}`;
        Object.assign(live, {
            stream_server: env_1.default.RP_RTMP_URL,
            stream_url: env_1.default.RP_HLS_URL + live.stream_key + '/index.m3u8' + signed,
            stream_key: live.stream_key + signed,
        });
        return live;
    }));
};
LiveStreamService.extendLiveEvent = async (currentUser, data) => {
    await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._extendLiveEventWithSession, {
        data,
        currentUser,
    });
};
