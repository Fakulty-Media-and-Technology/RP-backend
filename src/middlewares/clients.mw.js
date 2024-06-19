const UsersModel = require("../models/users.model");
const { validateToken } = require("../utils/jwt");

const clientsAuth = async (req, res, next) => {
    const token = req.headers["clients-auth"];

    if (!token) {
        return res.status(400).json({
            status: 400,
            message: "User not logged-in",
            data: null,
        });
    }

    try {
        const authUser = await validateToken(token);

        if (!authUser || authUser == "jwt expired") {
            return res.status(400).json({
                status: 400,
                message: "invalid token/expired",
                data: null,
            });
        }

        const id = Object.values(authUser)[0];
        const user = await UsersModel.findById({ _id: id });

        if (
            user.role !== "channel" &&
            user.role !== "tvshow" &&
            user.role !== "event" &&
            user.role !== "podcast"
        ) {
            return res.status(403).json({
                status: 403,
                message: "Access Denied, clients Route",
                data: null,
            });
        }

        if (user.suspended) {
            return res.status(403).json({
                status: 403,
                message:
                    "You are Suspended, please contact the clients service",
                data: null,
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(400).json({
            status: 400,
            message: error.message,
            data: null,
        });
    }
};

module.exports = clientsAuth;
