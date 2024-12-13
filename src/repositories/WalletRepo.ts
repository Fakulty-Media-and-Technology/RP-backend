import { WalletModel } from "../models/wallet.model";

    export class WalletRepo {
      static totalBalance = () =>
        WalletModel.aggregate([
          {
            $match: {
              $expr: {
                $ne: ['$user_id', null],
              },
            },
          },
          {
            $group: {
              _id: null,
              total_balance: { $sum: '$balance' },
            },
          },
          {
            $project: {
              _id: 0,
              total_balance: 1,
            },
          },
        ])
    }