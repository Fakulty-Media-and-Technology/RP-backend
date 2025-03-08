"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const PaymentRepo_1 = require("../../repositories/PaymentRepo");
const UserRepo_1 = require("../../repositories/UserRepo");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const promises_1 = require("../../utils/promises");
const photoUtils_1 = require("../../utils/photoUtils");
const OperationalError_1 = require("../../utils/OperationalError");
class ClientService {
}
exports.ClientService = ClientService;
_a = ClientService;
ClientService.getAll = async (query) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const clients = await UserRepo_1.UserRepo.adminFetchAllClientsAggr(page, limit);
    return (0, promises_1.getPromiseAllFulfilledResults)(await Promise.allSettled(clients.map(photoUtils_1.PhotoUtils.fetchUserAggrResPhoto)));
};
ClientService.getOneById = async (clientId) => {
    const [client] = await UserRepo_1.UserRepo.adminFetchClientAggrById(clientId);
    if (client == null) {
        throw new OperationalError_1.OperationalError('invalid Client Id', 404);
    }
    return await photoUtils_1.PhotoUtils.fetchUserAggrResPhoto(client);
};
ClientService.clientDeposits = async (query) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limt, 10);
    const clients = await PaymentRepo_1.PaymentRepo.getDeposits(page, limit);
    return clients;
};
