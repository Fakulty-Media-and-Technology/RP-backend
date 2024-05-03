const http = require("http");
const app = require("./app");

const PORT = process.env.PORT;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(
        `Node Server Listening on port: ${PORT} \n http://localhost:${PORT}`
    );
});

module.exports = server;
