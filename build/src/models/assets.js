"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadParents = exports.assets = exports.ratingsParent = void 0;
exports.ratingsParent = ['vod', 'episode'];
exports.assets = [...exports.ratingsParent, 'live'];
exports.videoUploadParents = [...exports.assets, 'trailer', 'subtitle'];
