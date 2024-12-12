import { Request } from 'express'
import { PaymentRepo } from '../../repositories/PaymentRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { QueryParamsFeatures, handleDefaultNumAndUnkown } from '../../utils/QueryParamsFeatures'

export class ClientService {
  static getAll = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(UserRepo.getAllClientsByRoles(), {
      queryParams: query,
      defaultPage: 1,
      defaultLimit: 10,
    })

    const clients = await features.query
    return clients.map(cl => cl.restricted())
  }

  static getOneById = async (clientId: string) => await UserRepo.getAClient(clientId)

  static clientDeposits = async (query: Request['query']) => {
    const page = handleDefaultNumAndUnkown(query.page, 1)
    const limit = handleDefaultNumAndUnkown(query.limt, 10)
    const clients = await PaymentRepo.getDeposits(page, limit)
    return clients
  }
}
