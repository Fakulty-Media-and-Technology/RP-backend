const PlansModel = require("../../models/plans.model");
const {
     serverError,
     successResponse,
     invalidRequest,
     failedResponse,
} = require("../../utils/response.handler");

exports.createPlan = async (req, res) => {
     try {
          const admin = req.user;

          const { months, price, details } = req.body;

          if (!months || !price || !details) {
               return invalidRequest(res, 400, null, "all input are required");
          }

          await new PlansModel({
               admin_id: admin._id,
               months_duration: Number(months),
               price: Number(price),
               details: details,
          }).save();

          return successResponse(res, 200, null, "plan created");
     } catch (error) {
          serverError(req, 500, null, error.message);
     }
};

exports.updatePlan = async (req, res) => {
     try {
          const admin = req.user;

          const id = req.params.id;

          const { months, price, details } = req.body;

          const oldValues = await PlansModel.findOne({
               _id: id,
          });

          if (!oldValues) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "something went wrong, not found"
               );
          }

          await PlansModel.findOneAndUpdate(
               {
                    _id: id,
               },
               {
                    admin_id: admin._id || oldValues.admin_id,
                    months_duration:
                         Number(months) || oldValues.months_duration,
                    price: Number(price) || oldValues.price,
                    details: details || oldValues.details,
               }
          );

          return successResponse(res, 200, null, "plan updated");
     } catch (error) {
          serverError(req, 500, null, error.message);
     }
};

exports.fetchPlans = async (req, res) => {
     try {
          const plans = await PlansModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $gt: ["$months_duration", 0],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                    },
               },
          ]);

          return successResponse(res, 200, plans, "plan fetched");
     } catch (error) {
          serverError(req, 500, null, error.message);
     }
};
