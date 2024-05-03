const UsersModel = require("../../models/users.model");
const { authCode } = require("../../utils/authCode");
const { VerifytPass, EncryptPass } = require("../../utils/bcrypt");
const { default: Email } = require("../../utils/emailer");
const { serverError } = require("../../utils/response.handler");

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

        const newUser = new UsersModel({
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: await EncryptPass(password),
            country_code: country_code,
            mobile: mobile,
            role: "customer",
            auth_code: pin,
        });

        await newUser.save();

        //TODO: send welcome pin to mobile number and or email
        const userData = {
            firstName: first_name,
            lastName: last_name,
            email: email,
        };

        new Email(userData).sendVerifyEmail(pin);

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

        const passVerify = await VerifytPass(password, userExist.password);

        if (!passVerify) {
            return invalidRequest(res, 400, null, "incorrect password");
        }

        const pin = Number(authCode(6));

        if (!userExist.verify) {
            //todo send email.....
            await UsersModel.findOneAndUpdate(
                {
                    email: userExist.email,
                },
                {
                    auth_code: pin,
                },
                {
                    upsert: true,
                }
            );

            const userData = {
                firstName: userExist.first_name,
                lastName: userExist.last_name,
                email: userExist.email,
            };

            new Email(userData).sendVerifyEmail(pin);

            return invalidRequest(
                res,
                400,
                null,
                "user email not verified, check your email for verification code"
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
