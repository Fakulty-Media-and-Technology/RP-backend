exports.authCode = (digit) => {
     let pin = "";
     for (let i = 0; i < Number(digit); i++) {
          const num = Math.floor(Math.random() * 10);
          pin += num;
     }
     return pin.toString().split(",").join("");
};
