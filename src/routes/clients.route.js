const express = require("express");
const clientsAuth = require("../middlewares/clients.mw");
const {
     clientProfileFetch,
     clientEditProfile,
} = require("../controllers/clients.controller.js/profile.clients");
const {
     liveStreamCredentials,
} = require("../controllers/clients.controller.js/livestream.clients");
const {
     createVoteInfo,
     addVoteContestant,
     updateVoteInfo,
     votestatusInfo,
} = require("../controllers/clients.controller.js/vote.clients");
const {
     reqPayout,
     reqPayoutEdit,
     payoutReqInfoAll,
     payoutReqInfoGroup,
} = require("../controllers/clients.controller.js/withdrawal.clients");

const clientsRouter = express.Router();

clientsRouter.use(clientsAuth);

clientsRouter.get("/profile/fetch", clientProfileFetch);

clientsRouter.put("/profile/edit", clientEditProfile);

clientsRouter.get("/livestream/streamkey", liveStreamCredentials);

clientsRouter.post("/livestream/vote/info", createVoteInfo);

clientsRouter.put("/livestream/vote/info/update", updateVoteInfo);

clientsRouter.post("/livestream/vote/contestant", addVoteContestant);

clientsRouter.get("/livestream/vote/voting-status", votestatusInfo);

clientsRouter.post("/payouts/payment/request", reqPayout);
clientsRouter.put("/payouts/payment/request/ed/:id", reqPayoutEdit);
clientsRouter.get("/payouts/payment/request/his", payoutReqInfoAll);
clientsRouter.get("/payouts/payment/request/group", payoutReqInfoGroup);

module.exports = clientsRouter;
