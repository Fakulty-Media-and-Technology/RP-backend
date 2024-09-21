const express = require("express");
const adminAuth = require("../middlewares/admin.mw");
const adminRouter = express.Router();

const {
     adminFetchUser,
     adminUpdateUser,
     adminDeleteUser,
} = require("../controllers/admins.controller.js/users.admin");
const {
     fetchUsersByVideoType,
     adminFetchChannel,
     adminFetchBalanceAndUser,
     countFreeUsers,
     countActiveUsers,
     countChannels,
     countEvents,
} = require("../controllers/admins.controller.js/dashboard.admin");
adminRouter.use(adminAuth);

adminRouter.get("/user/fetch", adminFetchUser);
adminRouter.patch("/user/update/:userId", adminUpdateUser);
adminRouter.delete("/user/deleteUser/:userId", adminDeleteUser);

adminRouter.get("/dashboard/fetchByVideoType", fetchUsersByVideoType);
adminRouter.get("/dashboard/fetchchannels", adminFetchChannel);

adminRouter.get("/dashboard/fetchbalance", adminFetchBalanceAndUser);
adminRouter.get("/dashboard/countFreeUsers", countFreeUsers);
adminRouter.get("/dashboard/countActiveUser", countActiveUsers);
adminRouter.get("/dashboard/countChannel", countChannels);
adminRouter.get("/dashboard/countEvents", countEvents);

module.exports = adminRouter;
