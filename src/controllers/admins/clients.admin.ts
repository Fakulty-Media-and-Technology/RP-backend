import { Catch } from '../../utils/catchAsync'
import { sendResponse } from '../../utils/responder'
import { ClientService } from '../../services/core/ClientService'

export class AdminClientsController {
  static getAllClients = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      message: 'all clients fetched successful',
      data: await ClientService.getAll(query),
      statusCode: 200,
    })
  })

  static getClient = Catch.async(async ({ params: { id: clientId } }, res) => {
    sendResponse({
      res,
      message: 'Client fetched successful',
      data: await ClientService.getOneById(clientId),
      statusCode: 200,
    })
  })

  static clientDeposits = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      statusCode: 200,
      message: 'all clients fetched successful',
      data: await ClientService.clientDeposits(query),
    })
  })
}
