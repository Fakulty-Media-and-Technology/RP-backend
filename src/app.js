require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const routes = require("./routes/index");
const connect = require("./livestream/nms");

const app = express();

const db_url = process.env.MONGO_URL;

const connectDB = async () => {
    try {
        await mongoose.connect(db_url);
        console.log("DB connected");
    } catch (error) {
        console.log(`Error in Connection: ${error.message}`);
    }
};

connectDB();

connect.register(app);

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

app.get("/", (req, res) => {
    res.json({
        status: 200,
        message: "REEPLAY API BASE_URL",
    });
});

app.use("/api", routes);

module.exports = app;
