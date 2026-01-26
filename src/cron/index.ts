import { schedule, ScheduledTask } from 'node-cron'
import { CronTaskHandlers } from './CronTaskHandlers'

export class CronTasks {
  private _nodeCronTasks: ScheduledTask[] = [
    schedule('*/10 * * * *', CronTaskHandlers.expireFeaturedContents),
    schedule('* * * * *', CronTaskHandlers.updateVidUploadsResolutions),
    schedule('0 * * * *', CronTaskHandlers.handle24HourLiveEventPushReminder),
    schedule('0 * * * *', CronTaskHandlers.handleOneHourLiveEventPushReminder),
  ]

  start() {
    this._nodeCronTasks.forEach(task => task.start())
  }

  stop() {
    this._nodeCronTasks.forEach(task => task.stop())
  }
}
