import { Request } from 'express'
import { PaymentRepo } from '../../repositories/PaymentRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { guranteeNumericResult, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { OperationalError } from '../../utils/OperationalError'

export class ClientService {
  static getAll = async (query: Request['query']) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)
    const clients = await UserRepo.adminFetchAllClientsAggr(page, limit)
    return clients
  }

  static getOneById = async (clientId: string) => {
    const [client] = await UserRepo.adminFetchClientAggrById(clientId)

    if (client == null) {
      throw new OperationalError('invalid Client Id', 404)
    }

    return client
  }

  static clientDeposits = async (query: Request['query']) => {
    const page = guranteeNumericResult(query.page, 1)
    const limit = guranteeNumericResult(query.limt, 10)
    return await PaymentRepo.getDeposits(page, limit)
  }
}
