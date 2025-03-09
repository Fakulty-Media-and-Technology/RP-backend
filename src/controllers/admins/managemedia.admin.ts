import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

import { AdminManageMediaService } from '../../services/core/AdminManagemediaService'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { SharedController } from '../common/shared.controller'
import { validate } from '../../middlewares/requestValidator'
import { addSubtitleSchema } from '../../validations/admin'

export class AdminManageSharedController extends SharedController {
  static createLive = ({ isAdmin }: { isAdmin: boolean }) =>
    Catch.async(async (req, res) => {
      if (isAdmin && typeof req.body.client_id !== 'string') {
        throw new OperationalError('/body.client_id is required/', 400)
      }

      if (!isAdmin) {
        req.body.client_id = GetDefined.loggedInUser(req.user).id
      }

      sendResponse({
        res,
        data: await AdminManageMediaService.createLive(req.body),
        message: 'live stream event scheduled, credentials are on attached user dashboard',
      })
    })

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
