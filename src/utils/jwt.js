const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET; //|| "prfvwegecxiagauswJt";

const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN;

exports.accessToken = (id, email, role) => {
     try {
          const token = jwt.sign(
               {
                    _id: id,
                    email: email,
                    role: role,
               },
               JWT_SECRET,
               {
                    expiresIn: "72h",
               }
          );

          return token;
     } catch (error) {
          console.log(error.message);
          return error.message;
     }
};

exports.refreshToken = (id, email, role) => {
     try {
          const token = jwt.sign(
               {
                    _id: id,
                    email: email,
                    role: role,
               },
               JWT_SECRET_REFRESH_TOKEN,
               {
                    expiresIn: "7d",
               }
          );

          return token;
     } catch (error) {
          console.log(error.message);
          return error.message;
     }
};

exports.validateToken = async (token) => {
     try {
          const data = jwt.verify(token, JWT_SECRET);
          return data;
     } catch (error) {
          console.log(error.message);
          return error.message;
     }
};

exports.validateRefreshToken = async (token) => {
     try {
          const data = jwt.verify(token, JWT_SECRET_REFRESH_TOKEN);
          return data;
     } catch (error) {
          console.log(error.message);
          return error.message;
     }
};

exports.logoutUser = async (id, email, role) => {
     try {
          const token = jwt.sign(
               {
                    _id: id,
                    email: email,
                    role: role,
               },
               JWT_SECRET,
               {
                    expiresIn: "1",
               }
          );

          return token;
     } catch (error) {
          console.log(error.message);
          return error.message;
     }
};
