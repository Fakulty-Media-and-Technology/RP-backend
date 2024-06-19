const express = require("express");
const clientsAuth = require("../middlewares/clients.mw");
const {
    clientProfileFetch,
    clientEditProfile,
} = require("../controllers/clients.controller.js/profile.clients");
const {
    liveStreamCredentials,
} = require("../controllers/clients.controller.js/livestream.clients");

const clientsRouter = express.Router();

clientsRouter.use(clientsAuth);

clientsRouter.get("/profile/fetch", clientProfileFetch);

clientsRouter.put("/profile/edit", clientEditProfile);

clientsRouter.get("/livestream/streamkey", liveStreamCredentials);

module.exports = clientsRouter;
