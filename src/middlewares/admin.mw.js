import UsersModel from "../models/users.model";
import { validateToken } from "../utils/jwt";

const adminAuth = async (req, res, next) => {
    const token = req.headers["admin-auth"];

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

        if (user.role !== "admin") {
            return res.status(403).json({
                status: 403,
                message: "Access Denied, admin Route",
                data: null,
            });
        }

        if (user.suspended) {
            return res.status(403).json({
                status: 403,
                message: "You are Suspended, please contact the admin service",
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

module.exports = adminAuth;
