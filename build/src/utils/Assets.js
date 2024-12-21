"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assets = void 0;
const node_path_1 = require("node:path");
class Assets {
}
exports.Assets = Assets;
Assets.rootMediaDirs = {
    multer: (0, node_path_1.resolve)('tempMedia'),
    nodeMediaServer: (0, node_path_1.resolve)('media'),
};
