const SuggestionsModel = require("../../models/suggestions.model");
const UsersModel = require("../../models/users.model");
const { readPhotos } = require("../../services/media-access");
const { deletePhoto } = require("../../services/media-management");
const PaymentDetails = require("../../models/updatePayment.model");
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

// exports.customerProfileFetch = async (req, res) => {
//      try {
//           const user = req.user;

//           if (!user._id && user.role === "guest") {
//                return invalidRequest(
//                     res,
//                     403,
//                     user,
//                     "you are not authenticated"
//                );
//           }

//           const profile = await UsersModel.aggregate([
//                {
//                     $match: {
//                          $expr: {
//                               $eq: [
//                                    "$_id",
//                                    {
//                                         $toObjectId: user._id,
//                                    },
//                               ],
//                          },
//                     },
//                },
//                {
//                     $lookup: {
//                          from: "PaymentDetails", // Ensure this matches the name of your PaymentDetails collection
//                          localField: "_id",
//                          foreignField: "user",
//                          as: "paymentDetails",
//                     },
//                },
//                {
//                     $unwind: {
//                          path: "$paymentDetails",
//                          preserveNullAndEmptyArrays: true, // Keep profile even if no payment details
//                     },
//                },

//                {
//                     $project: {
//                          // auth_code: 0,
//                          // auth_expiry: 0,
//                          // verified: 0,
//                          // approved: 0,
//                          // suspended: 0,
//                          // authorization_codes: 0,
//                          // last4: 0,
//                          // brand: 0,
//                          // createdAt: 0,
//                          // updatedAt: 0,
//                          __v: 0,
//                          // pin: 0,
//                          // password: 0,
//                          // payment: 1,
//                          // photo: 1,
//                          // first_name: 1,
//                          // last_name: 1,
//                          // email: 1,
//                          // country_code: 1,
//                          // mobile: 1,
//                          _id: 1,
//                          first_name: 1,
//                          last_name: 1,
//                          email: 1,
//                          country_code: 1,
//                          mobile: 1,
//                          photo: 1,
//                          "paymentDetails.authorization_codes": 1,
//                          "paymentDetails.last4": 1,
//                          "paymentDetails.brand": 1,
//                     },
//                },
//           ]);

//           if (!profile.length) {
//                return successResponse(
//                     res,
//                     200,
//                     {
//                          profile: null,
//                          photo_url: "no profile picture",
//                     },
//                     "customer profile fetched but no profile data"
//                );
//           }

//           const userPhoto = profile[0]?.photo;
//           if (!userPhoto || !userPhoto.Bucket || !userPhoto.Key) {
//                return successResponse(
//                     res,
//                     200,
//                     { profile: profile[0], photo_url: "no profile picture" },
//                     "client profile fetched"
//                );
//           }

//           const signedUrl = await readPhotos(userPhoto.Bucket, userPhoto.Key);
//           console.log("Photo Bucket:", userPhoto.Bucket);
//           console.log("Photo Key:", userPhoto.Key);
//           console.log("Signed URL:", signedUrl);
//           const paymentDetails = await PaymentDetails.find({
//                user: user._id,
//           });
//           console.log(paymentDetails);
//           return successResponse(
//                res,
//                200,
//                {
//                     profile: profile[0],
//                     photo_url:
//                          signedUrl.status === 400
//                               ? "no profile picture"
//                               : signedUrl,
//                },
//                "client profile fetched"
//           );
//      } catch (error) {
//           return serverError(res, 500, null, error.message);
//      }
// };

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

          // Fetch the user profile and related payment details using aggregation
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
               // {
               //      $lookup: {
               //           from: "PaymentDetails", // Ensure this matches the exact collection name
               //           localField: "_id",
               //           foreignField: "user",
               //           as: "paymentDetails",
               //      },
               // },
               // {
               //      $unwind: {
               //           path: "$paymentDetails",
               //           preserveNullAndEmptyArrays: true, // Keep profile even if no payment details
               //      },
               // },
               {
                    $project: {
                         __v: 0,
                         password: 0,
                         auth_code: 0,
                         auth_expiry: 0,
                         verified: 0,
                         approved: 0,
                         suspended: 0,
                         pin: 0,
                         // "paymentDetails._id": 0,
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
          console.log("Photo Bucket:", userPhoto.Bucket);
          console.log("Photo Key:", userPhoto.Key);
          console.log("Signed URL:", signedUrl);
          const paymentDetail = await PaymentDetails.find({
               user: user._id,
          }).select("-_id -user -__v -createdAt -updatedAt");
          return successResponse(
               res,
               200,
               {
                    profile: profile[0],
                    paymentDetail: paymentDetail,
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
                    _id: user.id,
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

          // Update payment details if provided
          if (payment) {
               const { authorization_codes, last4, brand } = payment;

               await PaymentDetails.findOneAndUpdate(
                    { user: user.id },
                    {
                         authorization_codes,
                         last4,
                         brand,
                    },
                    { new: true, upsert: true } // Create if it does not exist
               );
          }

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
