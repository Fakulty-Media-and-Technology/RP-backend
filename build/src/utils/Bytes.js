"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bytes = void 0;
class Bytes {
}
exports.Bytes = Bytes;
_a = Bytes;
Bytes.kb = (num) => num * 1024;
Bytes.mb = (num) => _a.kb(num) * 1024;
Bytes.gb = (num) => _a.mb(num) * 1024;
