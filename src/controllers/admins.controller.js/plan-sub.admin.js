const PlansModel = require("../../models/plans.model");
const {
     serverError,
     successResponse,
     invalidRequest,
     failedResponse,
} = require("../../utils/response.handler");

async function convertToLocalCurrency(usdAmount, userCurrency) {
     const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/USD`
     );
     const data = await response.json();
     const rate = data.rates[userCurrency];
     if (!rate) {
          throw new Error("Currency not supported");
     }
     return (usdAmount * rate).toFixed(2);
}
exports.createPlan = async (req, res) => {
     try {
          const admin = req.user;

          const { months, price, details, userCurrency } = req.body;

          if (!months || !price || !details || userCurrency) {
               return invalidRequest(res, 400, null, "all input are required");
          }

          const numMonths = Number(months);
          const numPrice = Number(price);
          if (isNaN(numMonths) || isNaN(numPrice)) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "Months and price must be valid numbers"
               );
          }
          // Convert price to user’s currency
          const convertedPrice = await convertToLocalCurrency(
               numPrice,
               userCurrency
          );
          await new PlansModel({
               admin_id: admin._id,
               months_duration: numMonths,
               price: convertedPrice,
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
                    admin_id: admin._id ? admin._id : oldValues.admin_id,
                    months_duration: months
                         ? Number(months)
                         : oldValues.months_duration,
                    price: price ? Number(price) : oldValues.price,
                    details: details ? details : oldValues.details,
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

exports.deletePlans = async (req, res) => {
     try {
          const admin = req.user._id;

          const id = req.params.id;
          const deletePlan = await PlansModel.findOneAndDelete({
               _id: id,
          });

          if (!deletePlan) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "plan can not be deleted or not found"
               );
          }

          return successResponse(res, 200, null, "plan deleted successfully");
     } catch (error) {
          serverError(req, 500, null, error.message);
     }
};
