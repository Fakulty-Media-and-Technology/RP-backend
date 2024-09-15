const SuggestionsModel = require("../../models/suggestions.model");
const UsersModel = require("../../models/users.model");
const { readPhotos } = require("../../services/media-access");
const { deletePhoto } = require("../../services/media-management");
const PaymentDetails = require("../../models/paymentDetails.model.js");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

function isValidEmail(email) {
     const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
     return emailRegex.test(email);
}

exports.customerProfileFetch = async (req, res) => {
     try {
          const user = req.user;

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    user,
                    "You are not authenticated"
               );
          }

          const profile = await UsersModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: [
                                   "$_id",
                                   {
                                        $toObjectId: user._id,
                                   },
                              ],
                         },
                    },
               },
               {
                    $lookup: {
                         from: "payment_details",
                         let: {
                              uid: "$_id",
                         },
                         pipeline: [
                              {
                                   $match: {
                                        $expr: {
                                             $eq: [
                                                  "$user_id",
                                                  {
                                                       $toObjectId: "$$uid",
                                                  },
                                             ],
                                        },
                                   },
                              },
                              {
                                   $project: {
                                        __v: 0,
                                        _id: 0,
                                        user_id: 0,
                                   },
                              },
                         ],
                         as: "paymentDetails",
                    },
               },
               {
                    $addFields: {
                         paymentDetails: {
                              $arrayElemAt: ["$paymentDetails", 0],
                         },
                    },
               },
               {
                    $lookup: {
                         from: "settings",
                         let: {
                              cid: "$_id",
                         },
                         pipeline: [
                              {
                                   $match: {
                                        $expr: {
                                             $eq: ["$$cid", "$user_id"],
                                        },
                                   },
                              },
                              {
                                   $project: {
                                        createdAt: 0,
                                        updatedAt: 0,
                                        __v: 0,
                                   },
                              },
                         ],
                         as: "settings_info",
                    },
               },
               {
                    $set: {
                         settings_info: {
                              $first: "$settings_info",
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                         password: 0,
                         auth_code: 0,
                         auth_expiry: 0,
                         verified: 0,
                         approved: 0,
                         suspended: 0,
                    },
               },
          ]);

          if (!profile.length) {
               return successResponse(
                    res,
                    200,
                    {
                         profile: null,
                         photo_url: "no profile picture",
                    },
                    "Customer profile fetched but no profile data"
               );
          }

          const userPhoto = profile[0]?.photo;

          if (!userPhoto || !userPhoto.Bucket || !userPhoto.Key) {
               return successResponse(
                    res,
                    200,
                    {
                         profile: profile[0],

                         photo_url: "no profile picture",
                    },
                    "Client profile fetched"
               );
          }

          const signedUrl = await readPhotos(userPhoto.Bucket, userPhoto.Key);

          return successResponse(
               res,
               200,
               {
                    profile: profile[0],
                    photo_url:
                         signedUrl.status === 400
                              ? "no profile picture"
                              : signedUrl,
               },
               "Client profile fetched"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editProfile = async (req, res) => {
     try {
          const user = req.user;

          const {
               first_name,
               last_name,
               country_code,
               mobile,
               photo,
               email,
               payment,
          } = req.body;

          if (email) {
               const bol = isValidEmail(email);

               if (!bol) {
                    console.log("Invalid email format:", email);
                    return invalidRequest(
                         res,
                         400,
                         null,
                         "invalid email format"
                    );
               }

               const existUs = await UsersModel.findOne({ email: email });

               if (existUs) {
                    console.log("Email already in use:", email);
                    return invalidRequest(
                         res,
                         409,
                         null,
                         "Email already in use"
                    );
               }
          }

          let initData = await UsersModel.findOne({ _id: user.id });
          if (!initData) {
               console.log("User not found:", user.id);
               return invalidRequest(res, 404, null, "User not found");
          }

          if (photo) {
               await deletePhoto(initData.photo);

               initData.photo = {};
          }

          await UsersModel.findOneAndUpdate(
               {
                    _id: user._id,
               },
               {
                    email: email ? email : initData.email,
                    first_name: first_name ? first_name : initData.first_name,
                    last_name: last_name ? last_name : initData.last_name,
                    country_code: country_code
                         ? country_code
                         : initData.country_code,
                    mobile: mobile ? mobile : initData.mobile,
                    photo: photo ? photo : initData.photo,
               }
          );

          return successResponse(
               res,
               200,
               null,
               "Profile and payment details updated"
          );
     } catch (error) {
          console.error("Server error:", error);
          return serverError(res, 500, null, error.message);
     }
};

exports.createSuggestion = async (req, res) => {
     try {
          const user = req.user;

          const { message } = req.body;

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          await new SuggestionsModel({
               user_id: user._id,
               message: message,
          }).save();

          return successResponse(
               res,
               200,
               null,
               "suggestion created and submitted to the admin"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
