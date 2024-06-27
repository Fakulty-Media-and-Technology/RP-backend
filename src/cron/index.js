const schedule = require("node-schedule");
const node_cron = require("node-cron");
const { fetchStreamKeys } = require("../livestream/nms");

const getActiveSessions = node_cron.schedule('*/5 * * * *', () => {
    fetchStreamKeys()
})

module.exports = {
    getActiveSessions
}