import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

import { AdminManageMediaService } from '../../services/core/AdminManagemediaService'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { SharedController } from '../common/shared.controller'
import { validate } from '../../middlewares/requestValidator'
import { addSubtitleSchema } from '../../validations/admin'

export class AdminManageSharedController extends SharedController {
  static searchClient = Catch.async(async (req, res) => {
    const clients = await AdminManageMediaService.searchClient(
      req.query.search as string,
      req.query,
    )

    sendResponse({
      res,
      data: clients,
      message: 'matched clients fetched',
    })
  })

  static getLivesByType = Catch.async(async ({ query, params: { type } }, res) => {
    sendResponse({
      res,
      data: await AdminManageMediaService.getLivesByType(type, query),
    })
  })

  //TODO delete and edit channel
  static addSubtitle = Catch.async(async (req, res) => {
    req.body.subtitle = req.file

    validate(addSubtitleSchema, req.body)

    sendResponse({
      res,
      message: 'subtitle added successfully',
      data: await AdminManageMediaService.addSubtitle(req.body),
    })
  })
}
