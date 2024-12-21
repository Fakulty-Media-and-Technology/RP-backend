"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountJSON = node_fs_1.default.readFileSync(node_path_1.default.resolve('src', 'reeplay-4a7cd-05669a07cbd9.json'), {
    encoding: 'utf-8',
});
console.log('Loaded firebase service account successfully ✔✔✔✔');
const credential = firebase_admin_1.default.credential.cert(JSON.stringify(serviceAccountJSON));
firebase_admin_1.default.initializeApp({ credential });
console.log('Initialize firebase Admin successfully ✔✔✔✔');
exports.default = firebase_admin_1.default;
