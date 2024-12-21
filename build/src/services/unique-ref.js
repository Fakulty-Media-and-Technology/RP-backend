"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueRef = void 0;
const node_crypto_1 = require("node:crypto");
const uniqueRef = (length = 12) => (0, node_crypto_1.randomBytes)(Math.round(length / 2)).toString('hex');
exports.uniqueRef = uniqueRef;
