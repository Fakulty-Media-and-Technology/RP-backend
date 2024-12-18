"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminClientsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responder_1 = require("../../utils/responder");
const ClientService_1 = require("../../services/core/ClientService");
class AdminClientsController {
}
exports.AdminClientsController = AdminClientsController;
_a = AdminClientsController;
AdminClientsController.getAllClients = catchAsync_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'all clients fetched successful',
        data: await ClientService_1.ClientService.getAll(query),
        statusCode: 200,
    });
});
AdminClientsController.getClient = catchAsync_1.Catch.async(async ({ params: { id: clientId } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'Client fetched successful',
        data: await ClientService_1.ClientService.getOneById(clientId),
        statusCode: 200,
    });
});
AdminClientsController.clientDeposits = catchAsync_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'all clients fetched successful',
        data: await ClientService_1.ClientService.clientDeposits(query),
    });
});
