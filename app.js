const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs');

const HttpError = require("./models/HttpError");
const userRoutes = require("./routes/user-routes");
const categoryRoutes = require("./routes/category-routes");
const playlistRoutes = require("./routes/playlist-routes");
const audioRoutes = require("./routes/audios-routes");

const MONGODB_URI = "mongodb://localhost:27017/music-app";

const app = express();

app.use(bodyParser.json());

app.use("/uploads/audios", express.static(path.join("uploads", "audios")));
app.use("/uploads/pictures", express.static(path.join("uploads", "pictures")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

    next();
});

app.use("/api/audios", audioRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/playlists", playlistRoutes);

app.use((req, res, next) => {
    throw new HttpError("Page not found", 404);
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        })
    }

    if (req.headersSent) {
        return next(error);
    }
    console.log(error);
    res.status(error.code || 500);
    res.json({ message: error.message || "Unknown error" });
});

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        app.listen(5000);
        console.log("Server started on 5000");
    })
    .catch((err) => {
        console.log(err);
    });
