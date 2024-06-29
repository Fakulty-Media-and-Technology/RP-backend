const schedule = require("node-schedule");
const node_cron = require("node-cron");
const { fetchStreamKeys } = require("../livestream/nms");

const getActiveSessions = node_cron.schedule('*/5 * * * *', () => {
    fetchStreamKeys()
})

// TODO
// cron and deactivate expired livestream
// cron and delete expired video

module.exports = {
    getActiveSessions
}