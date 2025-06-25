import { schedule, ScheduledTask } from 'node-cron'
import { CronTaskHandlers } from './CronTaskHandlers'

export class CronTasks {
  private _nodeCronTasks: ScheduledTask[] = [
    // schedule('*/5 * * * *', this._handleLiveStream),
    schedule('0 0 * * *', CronTaskHandlers.autoRenewSubscriptions),
    schedule('*/10 * * * *', CronTaskHandlers.expireFeaturedContents),
    schedule('*/2 * * * *', CronTaskHandlers.updateVidUploadsResolutions),
  ]

  // private async _handleLiveStream() {
  //   await Promise.allSettled([
  //     CronTaskHandlers.activateLiveStream,
  //     CronTaskHandlers.deActivateLiveStream,
  //   ])
  // }

  start() {
    this._nodeCronTasks.forEach(task => task.start())
    
  }

  stop() {
    this._nodeCronTasks.forEach(task => task.stop())
    
  }
}
