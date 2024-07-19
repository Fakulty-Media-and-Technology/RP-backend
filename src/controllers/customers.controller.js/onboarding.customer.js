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
               return invalidRequest(
                    res,
                    400,
                    req.body,
                    "all input are required"
               );
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

          const rxPattern =
               /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/;

          if (!rxPattern.test(password)) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "password is too weak: use capital, small letter, interger and not less than 8 character"
               );
          }

          const pin = Number(await authCode(6));

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
                    pin: pin?.toString(),
               }
          );

          return successResponse(
               res,
               200,
               null,
               "pin created/updated successfully"
          );
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

          if (userExist.suspended) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "you have been suspended from using our services, contact the admin"
               );
          }

          const authToken = await accessToken(
               userExist._id,
               userExist.email,
               userExist.role
          );

          return successResponse(
               res,
               200,
               {
                    _id: userExist._id,
                    email: userExist.email,
                    role: userExist.role,
                    token: authToken,
               },
               "user account verified"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.signIn = async (req, res) => {
     try {
          const { email, password } = req.body;

          if (!email || !password) {
               return invalidRequest(
                    res,
                    400,
                    req.body,
                    "all input are required"
               );
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

          const pin = Number(await authCode(6));

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

exports.getVerificationToken = async (req, res) => {
     try {
          const u_email = req.query.email;

          const userExist = await UsersModel.findOne({ email: u_email });

          if (userExist.verified) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "something went wrong, account already verified"
               );
          }

          const pin = Number(await authCode(6));

          const pinExpiry = Date.now() + 1000 * 60 * 5;

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
               200,
               null,
               "verification code sent to registered email successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.passwordChangeCode = async (req, res) => {
     try {
          const { email } = req.body;
          if (!email) {
               return invalidRequest(res, 400, null, "all input are required");
          }

          const emailUser = await UsersModel.findOne({
               email: email,
          });

          if (!emailUser) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "invalid email , user does not exist"
               );
          }

          const pin = Number(await authCode(6));

          await UsersModel.findOneAndUpdate(
               {
                    _id: emailUser._id,
                    email: emailUser.email,
               },
               {
                    auth_expiry: Date.now() + 10 * 60 * 1000, //code expires in 10 minutes
                    auth_code: pin,
               },
               {
                    upsert: true,
               }
          );

          const userData = {
               firstName: emailUser.first_name,
               lastName: emailUser.last_name,
               email: emailUser.email,
          };

          new Email(userData).sendResetPasswordToken(pin);

          return successResponse(
               res,
               200,
               null,
               "password reset email sent to registered email"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.passwordChange = async (req, res) => {
     try {
          const { email, pin, password, cpassword } = req.body;

          if (!email || !pin || !password || !cpassword) {
               return invalidRequest(res, 400, null, "all input are required");
          }

          const pinUser = await UsersModel.findOne({
               email: email,
               auth_code: Number(pin),
          });

          if (!pinUser) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "invalid credentials supplied"
               );
          }

          if (password !== cpassword) {
               return invalidRequest(res, 400, null, "paswords does not match");
          }

          if (Date.now() > Number(pinUser.auth_expiry)) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "password reset token has expired"
               );
          }

          const rxPattern =
               /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/;

          if (!rxPattern.test(password)) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "password is too weak, use capital & small letter, interger and not less than 8 character"
               );
          }

          const newPass = await EncryptPass(password);
          await UsersModel.findOneAndUpdate(
               {
                    _id: pinUser._id,
                    email: pinUser.email,
               },
               {
                    password: newPass,
                    auth_code: null,
                    auth_expiry: null,
               },
               {
                    upsert: true,
               }
          );

          return successResponse(
               res,
               200,
               null,
               "password changed successfully"
          );
     } catch (error) {
          console.log(error.message);
          return serverError(res, 500, null, error.message);
     }
};
