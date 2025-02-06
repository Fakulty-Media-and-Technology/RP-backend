import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

import { AdminManageMediaService } from '../../services/core/AdminManagemediaService'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { LiveSchema } from '../../models/lives.model'

export class AdminManagemediaController {
  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await AdminManageMediaService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static adminGetSubtitleUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await AdminManageMediaService.getSubtitleUrl(bucket, key)
    sendResponse({ res, data: image, message: 'subtitle fetched' })
  })

  static getVidoeUploadStream = Catch.async(async (req, res) => {
    const image = await AdminManageMediaService.getVodStream(
      req.params.vidUploadId,
      GetDefined.loggedInUser(req.user),
    )
    sendResponse({ res, data: image, message: 'stream fetched' })
  })

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

  static getLivesByType = (type: LiveSchema['type']) =>
    Catch.async(async ({ query }, res) => {
      sendResponse({
        res,
        data: await AdminManageMediaService.getLivesByType(type, query),
        message: `live ${type}s fecthed`,
      })
    })

  //TODO delete and edit channel
  static addSubtitle = Catch.async(async (req, res) => {
    await AdminManageMediaService.addSubtitle(req.body)

    sendResponse({
      res,
      message: 'subtitle added successfully',
    })
  })
}
