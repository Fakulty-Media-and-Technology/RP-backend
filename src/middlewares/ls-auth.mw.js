const UsersModel = require("../models/users.model");
const { validateToken } = require("../utils/jwt");

const liveStreamAuth = async (token) => {
    if (!token) {
        return {
            status: 400,
            message: "User not logged-in",
            data: null,
        };
    }

    try {
        const authUser = await validateToken(token);

        if (!authUser || authUser == "jwt expired") {
            return {
                status: 400,
                message: "invalid token/expired",
                data: null,
            };
        }

        const id = Object.values(authUser)[0];
        const user = await UsersModel.findById({ _id: id });

        if (user.suspended) {
            return res.status(403).json({
                status: 403,
                message:
                    "You are Suspended, please contact the customer service",
                data: null,
            });
        }

        return user
    } catch (error) {
        return {
            status: 400,
            data: null,
            message: error.message,
        };
    }
};

module.exports = liveStreamAuth;
