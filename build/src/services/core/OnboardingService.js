"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const users_model_1 = require("../../models/users.model");
const userSettings_model_1 = require("../../models/userSettings.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const strGen_1 = require("../../utils/strGen");
const emailer_1 = __importDefault(require("../../utils/emailer"));
const jwt_1 = require("../../utils/jwt");
const OperationalError_1 = require("../../utils/OperationalError");
const Password_1 = require("../../utils/Password");
class OnboardingService {
}
exports.OnboardingService = OnboardingService;
_a = OnboardingService;
OnboardingService.validateToken = async (token, type) => {
    if (typeof token !== 'string') {
        throw new OperationalError_1.OperationalError('required token must be a string', 404, { valid: false });
    }
    // this throws
    const authUser = await jwt_1.TokenManager.decode(token, type);
    if (!authUser || typeof authUser !== 'object') {
        throw new OperationalError_1.OperationalError(`invalid ${type} token/expired`, 404, { valid: false });
    }
    return true;
};
OnboardingService.refreshAccessToken = async (refreshToken) => {
    const authUser = await jwt_1.TokenManager.decode(refreshToken, 'refresh');
    return {
        accessToken: jwt_1.TokenManager.sign('access', authUser),
    };
};
OnboardingService.changePassword = async (data) => {
    const { email, pin, password, cpassword } = data;
    if (!email || !pin || !password || !cpassword) {
        throw new OperationalError_1.OperationalError('all input are required', 400);
    }
    const pinUser = await users_model_1.UserModel.findOne({
        email: email,
        auth_code: Number(pin),
    });
    if (!pinUser) {
        throw new OperationalError_1.OperationalError('invalid credentials supplied', 400);
    }
    if (password !== cpassword) {
        throw new OperationalError_1.OperationalError('paswords does not match', 400);
    }
    if (Date.now() > Number(pinUser.auth_expiry)) {
        throw new OperationalError_1.OperationalError('password reset token has expired', 400);
    }
    if (!Password_1.Password.isStrong(password)) {
        throw new OperationalError_1.OperationalError('password is too weak, use capital & small letter, interger and not less than 8 character', 400);
    }
    await users_model_1.UserModel.findOneAndUpdate({
        _id: pinUser._id,
        email: pinUser.email,
    }, {
        password: await Password_1.Password.encrypt(password),
        auth_code: null,
        auth_expiry: null,
    }, {
        upsert: true,
    });
};
OnboardingService.getVerificationToken = async (email) => {
    const pin = (0, strGen_1.authCode)(6);
    const pinExpiry = Date.now() + 1000 * 60 * 5;
    const user = await users_model_1.UserModel.findOneAndUpdate({
        email: email,
        verified: false,
    }, {
        auth_code: Number(pin),
        auth_expiry: pinExpiry,
    });
    if (user == null) {
        throw new OperationalError_1.OperationalError('either user is already verified or does not exist', 400);
    }
    const userData = {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
    };
    await new emailer_1.default(userData).sendVerifyEmail(pin);
};
OnboardingService.changePasswordCode = async (email) => {
    const emailUser = await UserRepo_1.UserRepo.getByEmail(email);
    if (!emailUser) {
        throw new OperationalError_1.OperationalError('invalid email , user does not exist', 400);
    }
    const pin = (0, strGen_1.authCode)(6);
    await users_model_1.UserModel.findOneAndUpdate({
        _id: emailUser._id,
        email: emailUser.email,
    }, {
        auth_expiry: Date.now() + 10 * 60 * 1000, //code expires in 10 minutes
        auth_code: pin,
    }, {
        upsert: true,
    });
    const userData = {
        firstName: emailUser.first_name,
        lastName: emailUser.last_name,
        email: emailUser.email,
    };
    await new emailer_1.default(userData).sendResetPasswordToken(pin);
};
OnboardingService.createPin = async (data) => {
    const { email, pin, cpin } = data;
    if (!email || !pin || !cpin) {
        throw new OperationalError_1.OperationalError('onboarding user email and pins are needed to continue', 400);
    }
    if (pin !== cpin) {
        throw new OperationalError_1.OperationalError('pins do not match', 404);
    }
    const userExist = await users_model_1.UserModel.findOneAndUpdate({ email }, { $set: { pin } }, { new: true });
    if (userExist === null) {
        throw new OperationalError_1.OperationalError('User does not exist', 404);
    }
};
OnboardingService.createCustomer = async (data) => {
    const { first_name, last_name, email, password, cpassword, country_code, mobile } = data;
    if (!first_name ||
        !last_name ||
        !email ||
        !password ||
        !cpassword ||
        !country_code ||
        !mobile) {
        throw new OperationalError_1.OperationalError(`All inputs are required.`, 400);
    }
    if (password !== cpassword) {
        throw new OperationalError_1.OperationalError('pasword does not match', 400);
    }
    if (!Password_1.Password.isStrong(password)) {
        throw new OperationalError_1.OperationalError('password is too weak: use capital, small letter, interger and not less than 8 character', 400);
    }
    const pin = (0, strGen_1.authCode)(6);
    const pinExpiry = Date.now() + 1000 * 60 * 5; // 5 mins
    const newUser = await users_model_1.UserModel.create({
        email,
        mobile,
        last_name,
        first_name,
        country_code,
        auth_code: pin,
        role: 'customer',
        auth_expiry: pinExpiry,
        password: await Password_1.Password.encrypt(password),
    });
    //TODO: send welcome pin to mobile number and or email
    const userData = {
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
    };
    await new emailer_1.default(userData).sendVerifyEmail(pin);
    return newUser;
};
OnboardingService.signIn = async (email, password) => {
    const userExist = await UserRepo_1.UserRepo.getByEmail(email);
    if (!userExist) {
        throw new OperationalError_1.OperationalError('user does not exist', 404);
    }
    if (userExist.suspended) {
        throw new OperationalError_1.OperationalError('you have been suspended from using our services, contact the admin', 404);
    }
    //create a customer settings DB if it doesn't exist
    const userSettingDB = await userSettings_model_1.SettingsModel.findOne({
        user_id: userExist._id,
    });
    if (!userSettingDB) {
        await userSettings_model_1.SettingsModel.create({
            user_id: userExist._id,
            video_quality: '720p',
        });
    }
    const passVerify = await Password_1.Password.compare(password, userExist.password);
    if (!passVerify) {
        throw new OperationalError_1.OperationalError('incorrect password', 404);
    }
    const pin = (0, strGen_1.authCode)(6);
    if (!userExist.verified) {
        // TODO: Use session to run the update and send email
        await users_model_1.UserModel.findOneAndUpdate({
            email: userExist.email,
        }, {
            auth_code: Number(pin),
            auth_expiry: Date.now() + 1000 * 60 * 5,
        });
        const userData = {
            firstName: userExist.first_name,
            lastName: userExist.last_name,
            email: userExist.email,
        };
        await new emailer_1.default(userData).sendVerifyEmail(pin);
        throw new OperationalError_1.OperationalError('user account not verified, check your email for verification code', 400);
    }
    const tokenPayload = {
        id: userExist.id,
        email: userExist.email,
        role: userExist.role,
    };
    const token = jwt_1.TokenManager.sign('access', tokenPayload);
    const refToken = jwt_1.TokenManager.sign('refresh', tokenPayload);
    return {
        _id: userExist._id,
        email: userExist.email,
        role: userExist.role,
        accessToken: token,
        refreshToken: refToken,
    };
};
OnboardingService.verifyAccount = async (email, token) => {
    const user = await UserRepo_1.UserRepo.getByEmail(email);
    if (!user) {
        throw new OperationalError_1.OperationalError('user does not exist', 400);
    }
    if (user.suspended) {
        throw new OperationalError_1.OperationalError('you have been suspended from using our services, contact the admin', 400);
    }
    if (user.verified) {
        throw new OperationalError_1.OperationalError('user account is already verified', 400);
    }
    if (token != user.auth_code) {
        throw new OperationalError_1.OperationalError('invalid token', 400);
    }
    if (user.auth_expiry && Date.now() > user.auth_expiry) {
        throw new OperationalError_1.OperationalError('token has expired!', 400);
    }
    await UserRepo_1.UserRepo.updateById(user.id, {
        verified: true,
        auth_code: null,
        auth_expiry: null,
    });
    const tolenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const authToken = jwt_1.TokenManager.sign('access', tolenPayload);
    return {
        ...tolenPayload,
        _id: user.id,
        token: authToken,
    };
};
