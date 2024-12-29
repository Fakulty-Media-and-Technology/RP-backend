import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

import {
  AdminManageMediaService,
  LivesType,
  UploadImageOrSubtitleType,
} from '../../services/core/AdminManagemediaService'

export class AdminManagemediaController {
  static uploadVideo = Catch.async(async ({ file, body: { expire, fileName } }, res) => {
    const video = await AdminManageMediaService.uploadVideo({
      file,
      expire,
      fileName,
    })

    sendResponse({ res, data: video, message: 'video uploaded' })
  })

  static uploadImageOrSubtitle = (type: UploadImageOrSubtitleType) =>
    Catch.async(async ({ file, body: { fileName } }, res) => {
      const upload = await AdminManageMediaService.uploadPhotoOrSubtitle({
        file,
        fileName,
        type,
      })

      sendResponse({ res, data: upload, message: `video ${type} uploaded` })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await AdminManageMediaService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static createLive = Catch.async(async (req, res) => {
    await AdminManageMediaService.createLive(req.body)

    sendResponse({
      res,
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
