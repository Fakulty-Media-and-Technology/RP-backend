import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

import {
  AdminManageMediaService,
  LivesType,
  UploadImageOrSubtitleType,
} from '../../services/core/AdminManagemediaService'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'

export class AdminManagemediaController {
  static uploadVideo = Catch.async(
    async ({ file, body: { expire, parentId, parentType } }, res) => {
      //
      const video = await AdminManageMediaService.uploadVideo({
        file,
        expire,
        parentId,
        parentType,
      })

      sendResponse({ res, data: video, message: 'video uploaded' })
    },
  )

  static uploadImageOrSubtitle = (type: UploadImageOrSubtitleType) =>
    Catch.async(async ({ file }, res) => {
      const upload = await AdminManageMediaService.uploadPhotoOrSubtitle({
        file,
        type,
      })

      sendResponse({ res, data: upload, message: `video ${type} uploaded` })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await AdminManageMediaService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
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

  static getLivesByType = (type: LivesType) =>
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
