import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { TrailerModel } from '../../models/trailer.model'
import { sendResponse } from '../../utils/responder'

export class AdminTrailerController {
  static createTrailer = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await TrailerModel.create(req.body),
      message: 'trailer created',
    })
  })

  static updateTrailer = Catch.async(async (req, res) => {
    const trailer = await TrailerModel.findByIdAndUpdate(req.params.trailerId, req.body, {
      new: true,
    })

    if (trailer === null) {
      throw new OperationalError('invalid trailer Id', 404)
    }

    sendResponse({
      res,
      data: trailer,
      message: 'trailer updated',
    })
  })
}
