import { TrailerModel } from '../../models/trailer.model'
import { UpcomingModel } from '../../models/upcoming.model'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import {  QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class AdminUpcomingController {
  static createUpcomingEvent = Catch.async(async (req, res) => {
    const { title, type, details, release_date, portrait_photo, landscape_photo, trailer_id } =
      req.body

    const checkTrailer = await TrailerModel.findOne({ _id: trailer_id })

    if (checkTrailer == null) {
      throw new OperationalError('invalid trailer_id supplied', 400)
    }

    const upcomingEvent = await UpcomingModel.create({
      title: title,
      type: type,
      details: details,
      release_date: new Date(release_date),
      portrait_photo: portrait_photo,
      landscape_photo: landscape_photo,
      trailer_id: trailer_id,
    })

    sendResponse({
      res,
      data: upcomingEvent,
      message: 'upcoming event created',
    })
  })

  static upcomingsAllGet = Catch.async(async ({ query }, res) => {
    const features = new QueryParamsFeatures(
      UpcomingModel.find({}).select('-__v -createdAt -updatedAt'),
      {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
      },
    )

    sendResponse({
      res,
      data: await features.paginate().query,
      message: 'all upcomings fetched',
    })
  })
}
