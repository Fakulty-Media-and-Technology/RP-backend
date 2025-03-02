import { SyncHandler } from '../utils/Catch'
import { OperationalError } from '../utils/OperationalError'

export const throwDepricatedRoute: SyncHandler = (_, __, next) => {
  return next(new OperationalError('This route is depricated', 400))
}
