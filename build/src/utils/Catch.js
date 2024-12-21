"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Catch = void 0;
class Catch {
}
exports.Catch = Catch;
_a = Catch;
Catch.async = (fn) => {
    return async (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
Catch.sync = (fn) => {
    return (req, res, next) => {
        try {
            fn(req, res, next);
        }
        catch (e) {
            next(e);
        }
    };
};
Catch.NMSPrePublishAsync = (fn) => {
    return async (id, streamKey) => {
        try {
            await fn(id, streamKey);
        }
        catch (e) {
            console.error('Error in nms prebublish handler');
            console.error(JSON.stringify(e, null, 2));
        }
    };
};
