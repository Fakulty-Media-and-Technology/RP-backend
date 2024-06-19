const express = require("express");
const superAdminRouter = require("./superadmin.route");
const customerRouter = require("./customers.route");
const clientsRouter = require("./clients.route");

const router = express.Router();

router.use("/customers", customerRouter);

router.use("/clients", clientsRouter);

// router.use("/admins");

router.use("/superadmin", superAdminRouter);

module.exports = router;
