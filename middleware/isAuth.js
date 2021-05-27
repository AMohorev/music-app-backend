const jwt = require("jsonwebtoken");

const HttpError = require("../models/HttpError");

module.exports = (req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            throw new Error("Auth failed");
        }
        const decodedToken = jwt.verify(token, "secret-key-for-music-app");
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (err) {
        console.log(err);
        const error = new HttpError("Auth failed", 401);
        return next(error);
    }
};