import { Request } from 'express'
import { PaymentRepo } from '../../repositories/PaymentRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { PhotoUtils } from '../../utils/photoUtils'
import { OperationalError } from '../../utils/OperationalError'

export class ClientService {
  static getAll = async (query: Request['query']) => {
    const page = handleDefaultNumAndUnknown(query.page, 1)
    const limit = handleDefaultNumAndUnknown(query.limit, 10)
    const clients = await UserRepo.adminFetchAllClientsAggr(page, limit)

    return getPromiseAllFulfilledResults(
      await Promise.allSettled(clients.map(PhotoUtils.fetchUserAggrResPhoto)),
    )
  }

  static getOneById = async (clientId: string) => {
    const [client] = await UserRepo.adminFetchClientAggrById(clientId)

    if (client == null) {
      throw new OperationalError('invalid Client Id', 404)
    }

    return await PhotoUtils.fetchUserAggrResPhoto(client)
  }

  static clientDeposits = async (query: Request['query']) => {
    const page = handleDefaultNumAndUnknown(query.page, 1)
    const limit = handleDefaultNumAndUnknown(query.limt, 10)
    return await PaymentRepo.getDeposits(page, limit)
  }
}
