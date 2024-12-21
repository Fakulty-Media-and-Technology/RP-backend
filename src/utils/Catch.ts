import { Request, Response, NextFunction } from 'express'

type AsyncHandler = (r: Request, re: Response, n: NextFunction) => Promise<void>
type SyncHandler = (r: Request, re: Response, n: NextFunction) => void
type NMSPrepublishHandler = (id: string, st: string) => Promise<void>

export class Catch {
  static async = (fn: AsyncHandler): AsyncHandler => {
    return async (req, res, next) => {
      fn(req, res, next).catch(next)
    }
  }

  static sync = (fn: SyncHandler): SyncHandler => {
    return (req, res, next) => {
      try {
        fn(req, res, next)
      } catch (e) {
        next(e)
      }
    }
  }

  static NMSPrePublishAsync = (fn: NMSPrepublishHandler): NMSPrepublishHandler => {
    return async (id, streamKey) => {
      try {
        await fn(id, streamKey)
      } catch (e) {
        console.error('Error in nms prebublish handler')
        console.error(JSON.stringify(e, null, 2))
      }
    }
  }
}
