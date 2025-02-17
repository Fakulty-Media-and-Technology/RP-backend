"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeOldTempMediaFiles = exports.deleteOldFile = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const Assets_1 = require("./Assets");
// npm install -S find-remove would be perfect but
// requires node 20.12... but current lts is 20.11...
const deleteOldFile = async (absFilePath, timeAgoDiffMs = 900000) => {
    const fileStat = await node_fs_1.default.promises.stat(absFilePath);
    if (Date.now() - fileStat.ctimeMs >= timeAgoDiffMs) {
        await node_fs_1.default.promises.unlink(absFilePath);
        console.log('func: deleteOldFile(..) deleted file:', absFilePath);
    }
};
exports.deleteOldFile = deleteOldFile;
const purgeOldTempMediaFiles = async () => {
    const tempMediaDir = Assets_1.Assets.rootMediaDirs.multer;
    try {
        const files = await node_fs_1.default.promises.readdir(tempMediaDir);
        const settled = await Promise.allSettled(files.map(file => (0, exports.deleteOldFile)(node_path_1.default.join(tempMediaDir, file))));
        settled.forEach(s => {
            if (s.status === 'rejected') {
                console.error('function: purgeOldTempMediaFiles', s.reason);
            }
        });
    }
    catch (e) {
        console.error('Error listing tempMedia files in function: purgeOldTempMediaFiles');
        console.error({
            errName: e.name,
            errMsg: e.message,
        });
    }
};
exports.purgeOldTempMediaFiles = purgeOldTempMediaFiles;
