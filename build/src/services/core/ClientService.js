"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const PaymentRepo_1 = require("../../repositories/PaymentRepo");
const UserRepo_1 = require("../../repositories/UserRepo");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class ClientService {
}
exports.ClientService = ClientService;
_a = ClientService;
ClientService.getAll = async (query) => {
    const features = new QueryParamsFeatures_1.QueryParamsFeatures(UserRepo_1.UserRepo.getAllClientsByRoles(), {
        queryParams: query,
        defaultPage: 1,
        defaultLimit: 10,
    });
    const clients = await features.query;
    return clients.map(cl => cl.restricted());
};
ClientService.getOneById = async (clientId) => await UserRepo_1.UserRepo.getAClient(clientId);
ClientService.clientDeposits = async (query) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limt, 10);
    const clients = await PaymentRepo_1.PaymentRepo.getDeposits(page, limit);
    return clients;
};
