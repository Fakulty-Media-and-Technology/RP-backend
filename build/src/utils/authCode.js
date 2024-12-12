"use strict";
exports.authCode = async (digit) => {
    try {
        let pin = '';
        for (let i = 0; i < Number(digit); i++) {
            const num = Math.floor(Math.random() * 10);
            pin += num;
        }
        return pin.toString().split(',').join('');
    }
    catch (error) {
        console.log(`error occurred authcode: ${error}`);
    }
};
