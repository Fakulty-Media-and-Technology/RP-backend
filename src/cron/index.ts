import nodeCron from 'node-cron'
import { CronTaskHandlers } from './CronTaskHandlers'

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
    console.log('Cron jobs started succesfully')
  }

  stop() {
    this._nodeCronTasks.forEach(task => task.stop())
    console.log('Cron jobs stoped succesfully')
  }
}
