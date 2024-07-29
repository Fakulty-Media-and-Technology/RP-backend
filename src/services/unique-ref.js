const uniqueRef = () => {
     const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
     const digits = "0123456789";
     const chars = letters + digits;
     const length = 12;
     let uniqref = "";

     for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * chars.length);
          uniqref += chars[randomIndex];
     }

     return uniqref;
};

module.exports = uniqueRef;
