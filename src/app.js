require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const cors = require("cors");

const routes = require("./routes/index");
const { connect } = require("./livestream/nms");
const { getActiveSessions } = require("./cron");

const app = express();

const db_url = process.env.MONGO_URL;

const connectDB = async () => {
    try {
        await mongoose.connect(db_url, {
            dbName: "reeplayDB",
        });

        console.log("DB connected");
    } catch (error) {
        console.log(`Error in Connection: ${error.message}`);
    }
};

connectDB();

connect.register(app);

//Cron Jobs
// getActiveSessions()

app.use(
    express.json({
        limit: "10gb",
    })
);
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(
    cors({
        origin: "*",
    })
);
app.use(
    fileUpload({
        limits: { fileSize: 10 * 1024 * 1024 * 1024 },
        useTempFiles: false,
        // tempFileDir: "/tmp/",
    })
);

app.get("/", (req, res) => {
    res.json({
        status: 200,
        message: "REEPLAY API BASE_URL",
    });
});

// app.get("/api/sse/upload-largevideo", (req, res) => {
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");
//     res.flushHeaders();

//     req.on("close", () => {
//         console.log("Connection closed");
//     });
// });

app.use("/api", routes);

module.exports = app;
