import nodeCron from 'node-cron'
import { CronTaskHandlers } from './CronTaskHandlers'

// const getActiveSessions = nodeCron.schedule('*/5 * * * *', async () => {
//   try {
//     // console.log("Active Sessions");
//   } catch (error: any) {
//     console.log('Cron Error: active sessions', error.message)
//   }
// })

export class CronTasks {
  private _nodeCronTasks: nodeCron.ScheduledTask[] = [
    nodeCron.schedule('*/5 * * * *', this._handleLiveStream),
    nodeCron.schedule('0 0 * * *', CronTaskHandlers.autoRenewSubscriptions),
    nodeCron.schedule('*/10 * * * *', CronTaskHandlers.expireFeaturedContents),
  ]

  private async _handleLiveStream() {
    await Promise.allSettled([
      CronTaskHandlers.activateLiveStream,
      CronTaskHandlers.deActivateLiveStream,
    ])
  }

  start() {
    this._nodeCronTasks.forEach(task => task.start())
  }

  stop() {
    this._nodeCronTasks.forEach(task => task.stop())
  }
}
