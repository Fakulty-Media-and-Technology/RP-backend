"use strict";
const express = require('express');
const adminAuth = require('../middlewares/admin.mw');
const adminRouter = express.Router();
adminRouter.use(adminAuth);
module.exports = adminRouter;
