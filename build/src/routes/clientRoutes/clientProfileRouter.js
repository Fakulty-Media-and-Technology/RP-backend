"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const profile_clients_1 = require("../../controllers/clients/profile.clients");
exports.router = (0, express_1.Router)();
exports.router.route('/').get(profile_clients_1.ClientProfileController.clientProfileFetch);
