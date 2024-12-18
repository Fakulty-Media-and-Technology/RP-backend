"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reeplayApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = __importDefault(require("node:path"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const index_1 = require("./routes/index");
// const { sendPushNotification, sendPush } = require('./notifications/notification')
const fileUploadOptions = {
    limits: { fileSize: 10 * 1024 * 1024 * 1024 },
    useTempFiles: false,
};
const devTestRoute = (_, res) => {
    res.status(200).json({
        status: 200,
        message: 'REEPLAY API BASE_URL',
    });
};
const reeplayApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '10gb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)({ origin: '*' }));
    app.use((0, express_fileupload_1.default)(fileUploadOptions));
    app.use('/static/images', express_1.default.static(node_path_1.default.join(__dirname, 'public/static')));
    app.get('/', devTestRoute);
    app.use('/api/v1', index_1.v1Router);
    return app;
};
exports.reeplayApp = reeplayApp;
