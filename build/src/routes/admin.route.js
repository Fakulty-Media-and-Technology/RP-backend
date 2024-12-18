"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
exports.adminRouter = express_1.default.Router();
exports.adminRouter.use(auth_1.AuthMiddleware.authenticateRequest('admin-auth'));
