"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHandler = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
class FileHandler {
}
exports.FileHandler = FileHandler;
FileHandler.createDirIfNotExistSync = (path) => {
    if (node_fs_1.default.existsSync(path)) {
        console.log(`dir: ${path} already exists`);
        return;
    }
    node_fs_1.default.mkdirSync(path);
    console.log(`dir: ${path} created successfully`);
};
