import { TrailerModel } from '../../models/trailer.model'
import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

export class AdminTrailerController {
  static createTrailer = Catch.async(async (req, res) => {
    await TrailerModel.create(req.body)

    sendResponse({
      res,
      data: await TrailerModel.create(req.body),
      message: 'trailer created',
    })
  })
}
