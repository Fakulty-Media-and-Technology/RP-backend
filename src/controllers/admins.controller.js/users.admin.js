// ....
const User = require("../../models/users.model");
const { EncryptPass } = require("../../utils/bcrypt");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

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
          console.error("Error fetching users:", error);

          // Return the response on failure
          return serverError(res, 500, null, "Error fetching user data");
     }
};

exports.adminUpdateUser = async (req, res) => {
     try {
          const { userId } = req.params;
          const {
               first_name,
               last_name,
               email,
               mobile,
               gender,
               date_of_birth,
               password,
          } = req.body;

          // Hash the password if it's being updated

          let hashedPassword = await EncryptPass(password);

          // Prepare the update fields
          const updateFields = {
               first_name,
               last_name,
               email,
               mobile,
               gender,
               date_of_birth,
               verified: true,
          };

          if (hashedPassword) {
               updateFields.password = hashedPassword;
          }
          // Find the user by ID and update
          const updatedUser = await User.findOneAndUpdate(
               { _id: userId },
               { $set: updateFields },
               { new: true, runValidators: true }
          );
          if (!updatedUser) {
               return failedResponse(res, 404, null, "User not found");
          }

          console.log("update user", updatedUser);
          return successResponse(
               res,
               200,
               updatedUser,
               "user details upadted successfully"
          );
     } catch (error) {
          console.log(error);
          return serverError(res, 500, null, "Error updating user");
     }
};

exports.adminDeleteUser = async (req, res) => {
     try {
          const { userId } = req.params;
          const user = await User.findByIdAndDelete(userId);
          if (!user) {
               return failedResponse(res, 404, null, "User not found");
          }
          console.log("user deleted");
          return successResponse(res, 200, user, "User deleted");
     } catch (error) {
          return serverError(res, 500, null, "cant delete user");
     }
};
