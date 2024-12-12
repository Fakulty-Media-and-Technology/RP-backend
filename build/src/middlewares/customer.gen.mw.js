"use strict";
const UsersModel = require('../models/users.model');
const { validateToken } = require('../utils/jwt');
const customerAuth = async (req, res, next) => {
    const token = req.headers['customer-auth'];
    if (!token) {
        return res.status(400).json({
            status: 400,
            message: 'User not logged-in',
            data: null,
        });
    }
    if (token === process.env.GUEST_TOKEN) {
        req.user = {
            first_name: 'guest',
            last_name: 'user',
            role: 'guest',
        };
    }
    try {
        const authUser = await validateToken(token);
        if (!authUser || authUser == 'jwt expired') {
            return res.status(400).json({
                status: 400,
                message: 'invalid token/expired',
                data: null,
            });
        }
        const id = Object.values(authUser)[0];
        const user = await UsersModel.findById({ _id: id });
        if (user.suspended) {
            return res.status(403).json({
                status: 403,
                message: 'You are Suspended, please contact the customer service',
                data: null,
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            data: null,
            message: error.message,
        });
    }
};
module.exports = customerAuth;
