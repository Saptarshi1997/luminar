const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const userRouter = require("./routes/user.routes");
const videoRouter = require("./routes/video.routes");

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({
    limit: "16kb",

}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));

app.use(express.static("public"));

app.use(cookieParser())


app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

module.exports = app;