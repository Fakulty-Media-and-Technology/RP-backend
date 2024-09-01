// const PayoutsModel = require("../../models/payouts.model");
// const WalletModel = require("../../models/wallet.model");
// const {
//      serverError,
//      successResponse,
//      failedResponse,
//      invalidRequest,
// } = require("../../utils/response.handler");

// exports.reqPayout = async (req, res) => {
//      try {
//         const user = req.user
//         const { amount, account_number, account_name, bank_name } = req.body

//         if(!amount || !account_name || !account_name || !bank_name){
//             return invalidRequest(res, 400, null, "all input are required")
//         }

//         const accBal = await WalletModel.findOne({user_id: user._id});

//         if(Number(amount) > Number(accBal.balance)){
//             return failedResponse(res, 400, null, "insufficient balance")
//         }

//         //check minimum withdrawal
//         if(Number(amount) > 10000) {

//         }

//         await new PayoutsModel({
//             client_id: user._id,
//             amount,
//             account_number,
//             account_name,
//             bank_name,
//         }).save()

//         return successResponse(res, 200, null, "payout request submitted")
//      } catch (error) {
//           return serverError(res, 500, null, error.message);
//      }
// };
