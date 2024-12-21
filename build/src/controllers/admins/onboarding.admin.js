"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOnboardingController = void 0;
const users_model_1 = require("../../models/users.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const Catch_1 = require("../../utils/Catch");
const jwt_1 = require("../../utils/jwt");
const OperationalError_1 = require("../../utils/OperationalError");
const Password_1 = require("../../utils/Password");
const responder_1 = require("../../utils/responder");
class AdminOnboardingController {
}
exports.AdminOnboardingController = AdminOnboardingController;
_a = AdminOnboardingController;
AdminOnboardingController._createUser = async (data, role) => {
    const { first_name, last_name, email, password, cpassword, country_code, mobile } = data;
    if (!first_name ||
        !last_name ||
        !email ||
        !password ||
        !cpassword ||
        !country_code ||
        !mobile) {
        throw new OperationalError_1.OperationalError('all input are required', 400);
    }
    // ! email is a unique property. It will throw if it already exists. This check is wasting time
    // const userExist = await UserRepo.getByEmail(email)
    // if (userExist) {
    //   throw new OperationalError('User with email already this exist', 400)
    // }
    if (password !== cpassword) {
        throw new OperationalError_1.OperationalError('passwords do not match', 400);
    }
    if (!Password_1.Password.isStrong(password)) {
        throw new OperationalError_1.OperationalError('password is too weak: use capital, small letter, interger and not less than 8 character', 400);
    }
    const [encPassword, encPin] = await Promise.all([
        Password_1.Password.encrypt(password),
        Password_1.Password.encrypt('1111'),
    ]);
    const newUser = new users_model_1.UserModel({
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: encPassword,
        pin: encPin,
        country_code,
        mobile,
        role,
        verified: true,
        approved: true,
    });
    await newUser.save();
    return newUser;
};
AdminOnboardingController.superAdminSignup = Catch_1.Catch.async(async (req, res) => {
    await _a._createUser(req.body, 'superadmin');
    (0, responder_1.sendResponse)({
        res,
        message: 'New SuperAdmin Account Created successfully',
    });
});
AdminOnboardingController.adminSignup = Catch_1.Catch.async(async (req, res) => {
    await _a._createUser(req.body, 'admin');
    (0, responder_1.sendResponse)({
        res,
        message: 'New admin Account Created successfully',
    });
});
AdminOnboardingController.clientsSignup = Catch_1.Catch.async(async (req, res) => {
    await _a._createUser(req.body, req.body.client_type);
    (0, responder_1.sendResponse)({
        res,
        message: 'New Client Account Created successfully',
    });
});
AdminOnboardingController.adminSignIn = Catch_1.Catch.async(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new OperationalError_1.OperationalError('all inputs are required', 400);
    }
    const userExist = await UserRepo_1.UserRepo.getByEmail(email);
    if (!userExist) {
        throw new OperationalError_1.OperationalError('User does not exist', 400);
    }
    if (!['channel', 'tvshow', 'event', 'podcast', 'admin', 'superadmin'].includes(userExist.role)) {
        throw new OperationalError_1.OperationalError('Admin login: not available to you', 400);
    }
    const passVerify = await Password_1.Password.compare(password, userExist.password);
    if (!passVerify) {
        throw new OperationalError_1.OperationalError('incorrect password', 400);
    }
    if (userExist.suspended) {
        throw new OperationalError_1.OperationalError('you have been suspended from using our services, contact the admin', 400);
    }
    const tokenPayload = {
        id: userExist.id,
        email: userExist.email,
        role: userExist.role,
    };
    const token = jwt_1.TokenManager.sign('access', tokenPayload);
    (0, responder_1.sendResponse)({
        res,
        message: 'Admin SignIn successfull',
        data: {
            ...tokenPayload,
            _id: tokenPayload.id,
            token,
        },
    });
});
