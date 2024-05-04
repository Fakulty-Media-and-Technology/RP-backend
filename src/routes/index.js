const express = require("express");
const superAdminRouter = require("./superadmin.route");

const router = express.Router();

router.route("/customers");

router.route("/clients");

router.route("/admins");

router.route("/superadmin", superAdminRouter);

module.exports = router;
