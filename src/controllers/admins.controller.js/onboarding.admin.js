const UsersModel = require("../../models/users.model");
const { EncryptPass, VerifytPass } = require("../../utils/bcrypt");
const { accessToken } = require("../../utils/jwt");
const {
     serverError,
     failedResponse,
     invalidRequest,
     successResponse,
} = require("../../utils/response.handler");

exports.superAdminSignup = async (req, res) => {
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

          const newUser = new UsersModel({
               first_name: first_name,
               last_name: last_name,
               email: email,
               password: await EncryptPass(password),
               pin: await EncryptPass("1111"),
               country_code: country_code,
               mobile: mobile,
               role: "superadmin",
               verified: true,
               approved: true,
          });

          await newUser.save();

          return successResponse(
               res,
               201,
               null,
               "New SuperAdmin Account Created successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.adminSignup = async (req, res) => {
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

          const newUser = new UsersModel({
               first_name: first_name,
               last_name: last_name,
               email: email,
               password: await EncryptPass(password),
               pin: await EncryptPass("1111"),
               country_code: country_code,
               mobile: mobile,
               role: "admin",
               verified: true,
               approved: true,
          });

          await newUser.save();

          return successResponse(
               res,
               201,
               null,
               "New Admin Account Created successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.clientsSignup = async (req, res) => {
     try {
          const {
               first_name,
               last_name,
               email,
               password,
               cpassword,
               country_code,
               mobile,
               client_type,
               verified,
               photo,
          } = req.body;

          if (
               !first_name ||
               !last_name ||
               !email ||
               !password ||
               !cpassword ||
               !country_code ||
               !mobile ||
               !verified ||
               !client_type
          ) {
               return invalidRequest(
                    res,
                    400,
                    req.body,
                    "all input are required"
               );
          }

          if (
               !["channel", "tvshow", "event", "podcast"].includes(client_type)
          ) {
               return invalidRequest(
                    res,
                    400,
                    client_type,
                    "invalid client type, we accept: channel, tvshow, event, podcast"
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

          const newUser = new UsersModel({
               first_name: first_name,
               last_name: last_name,
               email: email,
               password: await EncryptPass(password),
               pin: await EncryptPass("1111"),
               country_code: country_code,
               mobile: mobile,
               role: client_type,
               verified,
               approved: true,
               photo,
          });

          await newUser.save();

          return successResponse(
               res,
               201,
               null,
               "New Client Account Created successfully"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.adminSignIn = async (req, res) => {
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

          if (
               ![
                    "channel",
                    "tvshow",
                    "event",
                    "podcast",
                    "admin",
                    "superadmin",
               ].includes(userExist.role)
          ) {
               return failedResponse(
                    res,
                    403,
                    null,
                    "Admin login: not available to you"
               );
          }

          const passVerify = await VerifytPass(password, userExist.password);

          if (!passVerify) {
               return invalidRequest(res, 400, null, "incorrect password");
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
               "Admin sign In successful"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
