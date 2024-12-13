import { DashboardService } from '../../services/core/DashboardService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'


export class DashboardController {
  static fetchChannels = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: await DashboardService.fetchChannels(query),
    })
  })

  static currentAdminProfile = Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined.loggedInUser(user)
    const currentAdmin = await DashboardService.getCurrentAdminProfile(currentUser.id)

    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: currentAdmin,
    })
  })

  static editAdminProfile = Catch.async(async ({ user, body }, res) => {
    const currentUser = GetDefined.loggedInUser(user)
    const { first_name, last_name, country_code, mobile, photo, email, password } = body

    await DashboardService.editAdminProfile(currentUser, {
      first_name,
      last_name,
      country_code,
      mobile,
      photo,
      email,
      password,
    })

    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: null,
    })
  })

  static fetchVideosByType = Catch.async(async ({ query }, res) => {
    const videos = await DashboardService.fetchVideosByType(query.type, query)

    sendResponse({
      res,
      statusCode: 200,
      message: 'videos fetched by types',
      data: videos,
    })
  })

  static adminFetchChannel = Catch.async(async ({ query }, res) => {
    const channels = await DashboardService.fetchChannels(query)

    sendResponse({
      res,
      statusCode: 200,
      message: 'videos fetched by types',
      data: channels,
    })
  })

  static fetchBalanceAndUsers = Catch.async(async (_, res) => {
    sendResponse({
      res,
      statusCode: 200,
      message: 'Dashboard Balance and Users',
      data: await DashboardService.fetchBalanceAndUser(),
    })
  })

  static totalContentsAndChunks = Catch.async(async (_, res) => {
    sendResponse({
      res,
      statusCode: 200,
      message: 'Dashboard Balance and Users',
      data: await DashboardService.totalContentsAndChunks(),
    })
  })
}
