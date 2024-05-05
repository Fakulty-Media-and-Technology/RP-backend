const UserSettingsModel = require("../../models/userSettings.model");
const UsersModel = require("../../models/users.model");
const { authCode } = require("../../utils/authCode");
const { VerifytPass, EncryptPass } = require("../../utils/bcrypt");
const Email = require("../../utils/emailer");
const { accessToken } = require("../../utils/jwt");
const {
    serverError,
    successResponse,
    failedResponse,
    invalidRequest,
} = require("../../utils/response.handler");

exports.customerSignup = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            cpassword,
            country_code,
            mobile,
        } = req.body;

        if (
            !first_name ||
            !last_name ||
            !email ||
            !password ||
            !cpassword ||
            !country_code ||
            !mobile
        ) {
            return invalidRequest(res, 400, req.body, "all input are required");
        }

        const userExist = await UsersModel.findOne({
            email: email,
        });

        if (userExist) {
            return failedResponse(
                res,
                400,
                null,
                "User with email already this exist"
            );
        }

        if (password !== cpassword) {
            return invalidRequest(res, 400, null, "pasword does not match");
        }

        const rxPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/;

        if (!rxPattern.test(password)) {
            return invalidRequest(
                res,
                400,
                null,
                "password is too weak: use capital, small letter, interger and not less than 8 character"
            );
        }

        const pin = Number(authCode(6));

        const pinExpiry = Date.now() + 1000 * 60 * 5;

        const newUser = new UsersModel({
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: await EncryptPass(password),
            country_code: country_code,
            mobile: mobile,
            role: "customer",
            auth_code: pin,
            auth_expiry: pinExpiry,
        });

        await newUser.save();

        //TODO: send welcome pin to mobile number and or email
        const userData = {
            firstName: first_name,
            lastName: last_name,
            email: email,
        };

        const sendEmail = new Email(userData);
        sendEmail.sendVerifyEmail(pin);

        return successResponse(
            res,
            201,
            null,
            "New Customer Account Created successfully"
        );
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.createPin = async (req, res) => {
    try {
        const { email, pin, cpin } = req.body;

        if (!email || !pin || !cpin) {
            return invalidRequest(
                res,
                400,
                req.body,
                "onboarding user email and pins are needed to continue"
            );
        }

        const userExist = await UsersModel.findOne({
            email: email,
        });

        if (!userExist) {
            return failedResponse(res, 400, null, "User does not exist");
        }

        if (pin !== cpin) {
            return invalidRequest(res, 400, null, "pin does not match");
        }

        await UsersModel.findOneAndUpdate(
            {
                _id: userExist._id,
                email: email,
            },
            {
                pin: await EncryptPass(pin?.toString()),
            }
        );

        return successResponse(res, 200, null, "pin created successful");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.verifyAccount = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return invalidRequest(
                res,
                400,
                req.body,
                "user email and sent token are required"
            );
        }

        const userExist = await UsersModel.findOne({
            email: email,
        });

        if (!userExist) {
            return failedResponse(res, 400, null, "user does not exist");
        }

        if (userExist.verified) {
            return failedResponse(
                res,
                400,
                null,
                "user account already verified"
            );
        }

        if (token != userExist.auth_code) {
            return failedResponse(res, 400, null, "invalid token");
        }

        const isExpired = Date.now() > userExist.auth_expiry;

        if (isExpired) {
            return failedResponse(res, 400, null, "token has expired!");
        }

        await UsersModel.findOneAndUpdate(
            {
                _id: userExist._id,
                email: userExist.email,
            },
            {
                verified: true,
                auth_code: null,
                auth_expiry: null,
            }
        );

        return successResponse(res, 200, null, "user account verified");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return invalidRequest(res, 400, req.body, "all input are required");
        }

        const userExist = await UsersModel.findOne({
            email: email,
        });

        if (!userExist) {
            return failedResponse(res, 400, null, "User does not exist");
        }

        //create a customer settings DB if it doesn't exist
        const userSettingDB = await UserSettingsModel.findOne({
            user_id: userExist._id,
        });

        if (!userSettingDB) {
            await new UserSettingsModel({
                user_id: userExist._id,
                video_quality: "720p",
            }).save();
        }

        const passVerify = await VerifytPass(password, userExist.password);

        if (!passVerify) {
            return invalidRequest(res, 400, null, "incorrect password");
        }

        const pin = Number(authCode(6));

        const pinExpiry = Date.now() + 1000 * 60 * 5;

        if (!userExist.verified) {
            //todo send email.....
            await UsersModel.findOneAndUpdate(
                {
                    email: userExist.email,
                },
                {
                    auth_code: pin,
                    auth_expiry: pinExpiry,
                }
            );

            const userData = {
                firstName: userExist.first_name,
                lastName: userExist.last_name,
                email: userExist.email,
            };

            const sendEmail = new Email(userData);
            sendEmail.sendVerifyEmail(pin);

            return invalidRequest(
                res,
                400,
                null,
                "user account not verified, check your email for verification code"
            );
        }

        if (userExist.suspended) {
            return invalidRequest(
                res,
                400,
                null,
                "you have been suspended from using our services, contact the admin"
            );
        }

        const token = await accessToken(
            userExist._id,
            userExist.email,
            userExist.role
        );

        return successResponse(
            res,
            201,
            {
                _id: userExist._id,
                email: userExist.email,
                role: userExist.role,
                token: token,
            },
            "Sign In successful"
        );
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
