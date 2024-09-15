const express = require("express");
const adminAuth = require("../middlewares/admin.mw");
const adminRouter = express.Router();

const {
     adminFetchUser,
     adminUpdateUser,
     adminDeleteUser,
} = require("../controllers/admins.controller.js/users.admin");
adminRouter.use(adminAuth);

adminRouter.get("/user/fetch", adminFetchUser);
adminRouter.patch("/user/update/:userId", adminUpdateUser);
adminRouter.delete("/user/deleteUser/:userId", adminDeleteUser);

module.exports = adminRouter;
