const express = require("express");
const clientsAuth = require("../middlewares/clients.mw");
const {
     clientProfileFetch,
     clientEditProfile,
     clientsPaymentHis,
} = require("../controllers/clients.controller.js/profile.clients");
const {
     liveStreamCredentials,
     postPreviewVid,
     createLiveClient,
     calculateEventCharges,
     extendLiveEvent,
} = require("../controllers/clients.controller.js/livestream.clients");
const {
     createVoteInfo,
     addVoteContestant,
     updateVoteInfo,
     votestatusInfo,
     fetchVoteContestants,
     rmVoteContestants,
} = require("../controllers/clients.controller.js/vote.clients");
const {
     reqPayout,
     reqPayoutEdit,
     payoutReqInfoAll,
     payoutReqInfoGroup,
} = require("../controllers/clients.controller.js/withdrawal.clients");
const {
     createPayment,
     startPayment,
} = require("../controllers/customers.controller.js/payment.customer");

const clientsRouter = express.Router();

clientsRouter.use(clientsAuth);

clientsRouter.get("/profile/fetch", clientProfileFetch);
clientsRouter.get("/history/payment/fetch", clientsPaymentHis);

clientsRouter.put("/profile/edit", clientEditProfile);

clientsRouter.get("/livestream/streamkey", liveStreamCredentials);
// clientsRouter.put("/livestream/preview-vid/:live_id", postPreviewVid);

clientsRouter.post("/livestream/vote/info", createVoteInfo);
clientsRouter.put("/livestream/vote/info/update", updateVoteInfo);
clientsRouter.get("/livestream/vote/contestant/fetch", fetchVoteContestants);
clientsRouter.post("/livestream/vote/contestant", addVoteContestant);
clientsRouter.post("/livestream/vote/contestant/remove", rmVoteContestants);
clientsRouter.get("/livestream/vote/voting-status", votestatusInfo);

clientsRouter.post("/payouts/payment/request", reqPayout);
clientsRouter.put("/payouts/payment/request/ed/:id", reqPayoutEdit);
clientsRouter.get("/payouts/payment/request/his", payoutReqInfoAll);
clientsRouter.get("/payouts/payment/request/group", payoutReqInfoGroup);

clientsRouter.post("/payment/paystack/init", startPayment);
clientsRouter.post("/event/create/payment", createPayment);
clientsRouter.get("/event/payment/estimate", calculateEventCharges);
clientsRouter.post("/event/live/schedule", createLiveClient);
clientsRouter.post("/event/live/extend", extendLiveEvent);

module.exports = clientsRouter;
