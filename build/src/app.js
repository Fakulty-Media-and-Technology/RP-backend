"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reeplayApp = void 0;
const node_path_1 = __importDefault(require("node:path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const index_1 = require("./routes/index");
const errors_1 = require("./middlewares/errors");
const env_1 = __importDefault(require("./env"));
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
    app.use((0, cors_1.default)());
    app.use('/static/images', express_1.default.static(node_path_1.default.join(__dirname, 'public/static')));
    !env_1.default.IS_PROD && app.use((0, morgan_1.default)('dev'));
    app.get('/', devTestRoute);
    app.use('/api/v1', index_1.v1Router);
    app.use(errors_1.ErrorMiddleware.wildRoute);
    app.use(errors_1.ErrorMiddleware.allErrors);
    return app;
};
exports.reeplayApp = reeplayApp;
