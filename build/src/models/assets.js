"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadParents = exports.viewContents = exports.assets = exports.ratingsParent = void 0;
exports.ratingsParent = ['vod', 'episode'];
exports.assets = [...exports.ratingsParent, 'live'];
exports.viewContents = [...exports.assets, 'trailer'];
exports.videoUploadParents = [...exports.viewContents, 'subtitle'];
