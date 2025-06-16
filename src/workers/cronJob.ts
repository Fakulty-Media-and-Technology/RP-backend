import { workerData } from 'node:worker_threads'
import { CronTasks } from '../cron'
import { connectMongoDB } from '../utils/connectDB'

const jobs = new CronTasks()

if (workerData.action === 'START') {
  connectMongoDB().then(() => {
    jobs.start()
    console.log('Cron jobs started successfully')
  })
}

if (workerData.action === 'STOP') {
  connectMongoDB().then(() => {
    jobs.stop()
    console.log('Cron jobs stopped successfully')
  })
}
