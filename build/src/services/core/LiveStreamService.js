"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const env_1 = __importDefault(require("../../env"));
const lives_model_1 = require("../../models/lives.model");
const payments_model_1 = require("../../models/payments.model");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const UserRepo_1 = require("../../repositories/UserRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const calcLiveCharges = (start, expiry) => {
    const startDate = new Date(start).getTime();
    const expiryDate = new Date(expiry).getTime();
    const hoursDifference = (expiryDate - startDate) / (60 * 60000);
    return hoursDifference * parseFloat(env_1.default.EVENT_HOURLY_CHARGES);
};
const genRandUniqId = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    const randomBytes = node_crypto_1.default.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % charsLength];
    }
    return result;
};
class LiveStreamService {
}
exports.LiveStreamService = LiveStreamService;
_a = LiveStreamService;
LiveStreamService.calcEventCharges = (start, expiry) => {
    if (typeof start !== 'string' || typeof expiry !== 'string') {
        throw new OperationalError_1.OperationalError('start and expirey must be strings', 400);
    }
    return {
        estimated_cost: calcLiveCharges(start, expiry),
    };
};
LiveStreamService.createClient = async (currentUser, data) => {
    const { id: client_id } = currentUser;
    const { title, sub_title, cover_photo, vid_class, pg, category, description, type, start, expiry, sponsored, popular, video, location, payment_id, } = data;
    if (!title ||
        !sub_title ||
        !cover_photo ||
        !vid_class ||
        !pg ||
        !category ||
        !description ||
        !type ||
        !sponsored ||
        !popular ||
        !start ||
        !payment_id ||
        !location) {
        throw new OperationalError_1.OperationalError('all important fields are required', 400);
    }
    const vclient_id = await UserRepo_1.UserRepo.getClientByRolesAndId(client_id, [
        'channel',
        'event',
        'podcast',
        'tvshow',
    ]);
    if (!vclient_id) {
        throw new OperationalError_1.OperationalError('assigned user not found', 400);
    }
    const confirmPayment = await payments_model_1.PaymentModel.findOne({
        _id: payment_id,
        user_id: vclient_id._id,
        status: 'success',
        is_used: false,
    });
    if (!confirmPayment) {
        throw new OperationalError_1.OperationalError('your payment is invalid', 400);
    }
    if (confirmPayment.amount !== calcLiveCharges(start, expiry)) {
        throw new OperationalError_1.OperationalError('payment made does not match charges', 400);
    }
    const streamId = genRandUniqId(12);
    const streamIdExist = await lives_model_1.LiveModel.findOne({
        stream_key: streamId,
    });
    if (streamIdExist) {
        throw new OperationalError_1.OperationalError('Please try again', 400);
    }
    const streamOngoing = await LiveRepo_1.LiveRepo.getActiveById(client_id);
    if (streamOngoing !== null) {
        throw new OperationalError_1.OperationalError('client have an ongoing stream', 400);
    }
    const scheduledStream = await lives_model_1.LiveModel.find({
        _id: client_id,
        active: false,
        expired: true,
    });
    if (scheduledStream.length > 0) {
        throw new OperationalError_1.OperationalError('client alrealdy have pending scheduled stream', 400);
    }
    // TODO: Use Session
    await new lives_model_1.LiveModel({
        client_id: vclient_id._id,
        title: title,
        sub_title: sub_title,
        stream_key: streamId,
        cover_photo: cover_photo,
        vid_class: vid_class,
        pg: pg,
        category: category,
        description: description,
        type: type,
        start: new Date(start),
        expiry: new Date(expiry),
        sponsored,
        popular,
        location,
        preview_video: video,
        payment_id: confirmPayment._id,
    }).save();
    // TODO: error handling
    await payments_model_1.PaymentModel.findByIdAndUpdate(confirmPayment._id, {
        is_used: true,
        use_case: 'live schedule',
    });
};
LiveStreamService.getLiveStreamCredentials = async (currentUser) => {
    const strm_url = `${env_1.default.RP_RTMPURL}`; //?email=''&&password=''
    const credentials = await lives_model_1.LiveModel.aggregate([
        {
            $match: {
                client_id: currentUser._id,
                expired: false,
            },
        },
        {
            $addFields: {
                stream_server: strm_url,
            },
        },
        {
            $addFields: {
                stream_url: {
                    $concat: [env_1.default.RP_HLSURL, '$stream_key', '/index.m3u8'],
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);
    return credentials;
};
LiveStreamService.extendLiveEvent = async (currentUser, data) => {
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
    if (confirmPayment.amount !== calcLiveCharges(liveEvent.expiry.toISOString(), new_expiry)) {
        throw new OperationalError_1.OperationalError('payment made does not match charges', 400);
    }
    const streamId = genRandUniqId(12);
    const streamIdExist = await lives_model_1.LiveModel.findOne({
        stream_key: streamId,
    });
    if (streamIdExist) {
        throw new OperationalError_1.OperationalError('Oops, please try again', 400);
    }
    // TODO: Use Session
    await lives_model_1.LiveModel.findOneAndUpdate({
        _id: live_id,
        client_id: client_id,
    }, {
        expiry: new Date(new_expiry),
        extpayment_id: confirmPayment._id,
    });
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: confirmPayment._id,
    }, {
        is_used: true,
        use_case: 'live schedule ext',
    });
};
