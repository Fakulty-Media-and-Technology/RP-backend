import UsersModel from "../models/users.model";
import { validateToken } from "../utils/jwt";

const eventAuth = async (req, res, next) => {
    const token = req.headers["event-auth"];

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

        if (user.role !== "event") {
            return res.status(403).json({
                status: 403,
                message: "Access Denied, event Route",
                data: null,
            });
        }

        if (user.suspended) {
            return res.status(403).json({
                status: 403,
                message: "You are Suspended, please contact the event service",
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

module.exports = eventAuth;
