"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromiseAllFulfilledResults = void 0;
const getPromiseAllFulfilledResults = (results) => {
    return results.reduce((acc, cur) => {
        if (cur.status === 'fulfilled')
            acc.push(cur.value);
        return acc;
    }, []);
};
exports.getPromiseAllFulfilledResults = getPromiseAllFulfilledResults;
