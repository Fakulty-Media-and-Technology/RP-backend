const UserDeviceModel = require('../../models/userDevice.model')
const { serverError, successResponse, failedResponse } = require('../../utils/response.handler')

exports.registerDeviceToken = async (req, res) => {
  try {
    const user = req.user

    const { device_token, device_id, device_type } = req.body

    const userDevice = new UserDeviceModel({
      user_id: user._id,
      device_id: device_id,
      device_token: device_token,
      device_type: device_type,
    })

    await userDevice.save()

    successResponse(res, 200, null, 'FCM device token registered successfully')
  } catch (error) {
    serverError(res, 500, null, error.message)
  }
}

exports.updateDeviceToken = async (req, res) => {
  try {
    const user = req.user

    const { device_token, device_id, device_type } = req.body

    const checkDevice = await UserDeviceModel.findOne({
      user_id: user.id,
      device_token: device_token,
    })

    if (checkDevice) {
      return failedResponse(res, 400, null, 'device information is up to date')
    }

    await UserDeviceModel.findOneAndUpdate(
      {
        user_id: user._id,
      },
      {
        device_id: device_id || checkDevice.device_id,
        device_token: device_token || checkDevice.device_token,
        device_type: device_type || checkDevice.device_type,
      },
      {
        upsert: true,
      },
    )

    successResponse(res, 200, null, 'FCM device token updated successfully')
  } catch (error) {
    serverError(res, 500, null, error.message)
  }
}
