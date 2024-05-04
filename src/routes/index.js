const express = require("express");
const superAdminRouter = require("./superadmin.route");
const customerRouter = require("./customers.route");

const router = express.Router();

router.use("/customers", customerRouter);

// router.use("/clients");

// router.use("/admins");

router.use("/superadmin", superAdminRouter);

module.exports = router;
