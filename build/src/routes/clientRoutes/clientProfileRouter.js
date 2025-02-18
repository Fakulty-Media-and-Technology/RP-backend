"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const profile_clients_1 = require("../../controllers/clients/profile.clients");
const requestValidator_1 = require("../../middlewares/requestValidator");
const client_1 = require("../../validations/client");
exports.router = (0, express_1.Router)();
exports.router
    .route('/')
    .get(profile_clients_1.ClientProfileController.clientProfileFetch)
    .post((0, requestValidator_1.requestValidator)(client_1.updateProfileSchema), profile_clients_1.ClientProfileController.clientEditProfile);
