import { AdminPlanSubService } from '../../services/core/AdminPlanService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class AdminPlanSubController {
  static createPlan = Catch.async(async (req, res) => {
    await AdminPlanSubService.createPlan(GetDefined.loggedInUser(req.user), req.body)

    sendResponse({
      res,
      message: 'plan created',
    })
  })

  static updatePlan = Catch.async(async (req, res) => {
    await AdminPlanSubService.updatePlan(req.params.id, req.body)

    sendResponse({
      res,
      message: 'plan updated',
    })
  })

  static fetchPlans = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await AdminPlanSubService.fetchPlans(req.query),
      message: 'plan fetched',
    })
  })

  static fetchSubscriptions = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await AdminPlanSubService.fetchSubs(query),
      message: 'plan subs fetched',
    })
  })

  static deletePlans = Catch.async(async (req, res) => {
    await AdminPlanSubService.deletePlan(req.params.id)

    sendResponse({
      res,
      message: 'plan deleted successfully',
    })
  })
}
