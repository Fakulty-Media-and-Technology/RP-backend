"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronTasks = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const CronTaskHandlers_1 = require("./CronTaskHandlers");
class CronTasks {
    constructor() {
        this._nodeCronTasks = [
            node_cron_1.default.schedule('*/5 * * * *', this._handleLiveStream),
            node_cron_1.default.schedule('0 0 * * *', CronTaskHandlers_1.CronTaskHandlers.autoRenewSubscriptions),
            node_cron_1.default.schedule('*/10 * * * *', CronTaskHandlers_1.CronTaskHandlers.expireFeaturedContents),
        ];
    }
    async _handleLiveStream() {
        await Promise.allSettled([
            CronTaskHandlers_1.CronTaskHandlers.activateLiveStream,
            CronTaskHandlers_1.CronTaskHandlers.deActivateLiveStream,
        ]);
    }
    start() {
        this._nodeCronTasks.forEach(task => task.start());
        console.log('Cron jobs started succesfully');
    }
    stop() {
        this._nodeCronTasks.forEach(task => task.stop());
        console.log('Cron jobs stoped succesfully');
    }
}
exports.CronTasks = CronTasks;
