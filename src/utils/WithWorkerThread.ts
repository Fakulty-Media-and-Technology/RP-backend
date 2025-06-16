import path from 'node:path'
import { Worker } from 'node:worker_threads'

type Actions = 'START' | 'STOP'

export class WithWorkerThread {
  static manageJobs = (action: Actions) =>
    new Promise<void>((resolve, reject) => {
      const workerFile = path.resolve('build', 'src', 'workers', 'cronJob.js')
      const worker = new Worker(workerFile, { workerData: { action } })
      worker.on('error', reject)
      worker.on('message', resolve)
    })
}
