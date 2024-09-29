// ....
const User = require("../../models/users.model");
const { EncryptPass } = require("../../utils/bcrypt");
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

exports.adminFetchUser = async (req, res) => {
     try {
          const result = await User.aggregate([
               {
                    $project: {
                         fullname: {
                              $concat: ["$first_name", " ", "$last_name"],
                         },
                         email: 1,
                         totalSub: 1,
                         joined: "$createdAt",
                         substatus: {
                              $cond: {
                                   if: { $eq: ["$verified", true] },
                                   then: "Active",
                                   else: "Inactive",
                              },
                         },
                         verified: 1,
                    },
               },
          ]);

          return successResponse(res, 200, result, "user details fetched");
     } catch (error) {
          return serverError(res, 500, null, "Error fetching user data");
     }
};

exports.adminFetchSingleUser = async (req, res) => {
     try {
          const { userId } = req.params;

          const user = await User.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: [
                                   "$_id",
                                   {
                                        $toObjectId: userId,
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         fullname: {
                              $concat: [
                                   { $ifNull: ["$first_name", ""] },
                                   " ",
                                   { $ifNull: ["$last_name", ""] },
                              ],
                         },
                         email: 1,
                         mobile: 1,
                         gender: 1,
                         dob: 1,
                         joined: "$createdAt",
                         verified: 1,
                         substatus: {
                              $cond: {
                                   if: { $eq: ["$verified", true] },
                                   then: "Active",
                                   else: "Inactive",
                              },
                         },
                    },
               },
          ]);

          if (!user) {
               return failedResponse(res, 404, null, "User not found");
          }

          return successResponse(
               res,
               200,
               user,
               "One user fetched successfully"
          );
     } catch (error) {
          console.log(error);
          return serverError(res, 500, null, "Error fetching user");
     }
};

exports.editUserProfile = async (req, res) => {
     try {
          const { userId } = req.params;
          const {
               first_name,
               last_name,
               country_code,
               mobile,
               dob,
               email,
               gender,
               password,
          } = req.body;

          if (email) {
               const bol = isValidEmail(email);

               if (!bol) {
                    return invalidRequest(
                         res,
                         400,
                         null,
                         "invalid email format"
                    );
               }
          }

          const updatedUser = await User.findOneAndUpdate(
               {
                    _id: userId,
               },
               {
                    email: email,
                    password: await EncryptPass(password),

                    first_name: first_name,
                    last_name: last_name,

                    mobile: mobile,

                    gender: gender,
                    dob: dob,
                    verified: true,
                    approved: true,
               },
               { new: true }
          );
          console.log("userr", updatedUser);
          // Check if user was found and updated
          if (!updatedUser) {
               return invalidRequest(res, 404, null, "User not found");
          }

          return successResponse(res, 200, updatedUser, "Profile updated");
     } catch (error) {
          console.error("Server error:", error);
          return serverError(res, 500, null, error.message);
     }
};

exports.adminDeleteUser = async (req, res) => {
     try {
          const { userId } = req.params;
          const deleteUser = await User.findOneAndDelete({
               _id: userId,
          });

          if (!deleteUser) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "user can not be deleted or not found"
               );
          }

          return successResponse(res, 200, null, "user deleted successfully");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};
