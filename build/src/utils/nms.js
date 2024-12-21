"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchValidStreamKeys = void 0;
const LiveRepo_1 = require("../repositories/LiveRepo");
const fetchValidStreamKeys = async () => {
    try {
        const keys = await LiveRepo_1.LiveRepo.getActiveStreamKeys();
        if (keys.length === 0) {
            throw new Error('no active stream key');
        }
        return keys;
    }
    catch (error) {
        console.error('Error fetching stream keys:', error);
        return null;
    }
};
exports.fetchValidStreamKeys = fetchValidStreamKeys;
