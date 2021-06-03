const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/HttpError");
const User = require("../models/user");
const Playlist = require("../models/playlist");

const getUsers = async (req, res, next) => {
    let users;
    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (user.role !== "admin") {
        const error = new HttpError("You dont have permission to do that", 403);
        return next(error);
    }

    try {
        users = await User.find({}, "-password");
    } catch (err) {
        const error = new HttpError("Could not receive user list", 500);
        return next(error);
    }

    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs", 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError("Failed to get user", 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError("User already exists", 422);
        return next(error);
    }

    let hashedPass;
    try {
        hashedPass = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError("Could not create user", 500);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        password: hashedPass,
        image: req.file.path.replace(/\\/g, "/"),
        playlists: [],
    });

    const playlistLiked = new Playlist({
        name: "Liked",
        owner: createdUser,
    });

    try {
        await playlistLiked.save();
        createdUser.playlists.push(playlistLiked);
        await createdUser.save();
    } catch (err) {
        const error = new HttpError("User creation failed", 500);
        console.log(err);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            "secret-key-for-music-app",
            { expiresIn: "1h" }
        );
    } catch (err) {
        const error = new HttpError("Failed in creating new user", 500);
        return next(error);
    }

    res.status(201).json({
        userId: createdUser.id,
        role: createdUser.role,
        token: token,
    });
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    let isValidPass;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError("Logging in failed, try again later", 500);
        return next(error);
    }

    if (!existingUser) {
        const error = new HttpError("Invalid login", 401);
        return next(error);
    }

    if (existingUser.isBanned === true) {
        const error = new HttpError("You have been banned", 403);
        return next(error);
    }

    try {
        isValidPass = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError("Invalid password", 401);
        return next(error);
    }

    if (!isValidPass) {
        const error = new HttpError("Invalid password", 401);
        return next(error);
    }

    let token;

    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            "secret-key-for-music-app",
            { expiresIn: "1h" }
        );
    } catch (err) {
        const error = new HttpError("Logging in failed", 500);
        return next(error);
    }

    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        token: token,
    });
};

const banUser = async (req, res, next) => {
    const userId = req.body.userId;
    const type = req.body.type;

    let user;
    let bannedUser;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (user.role !== "admin") {
        const error = new HttpError("You dont have permission to do that", 403);
        return next(error);
    }

    if (user._id.toString() === userId.toString() && type === "ban") {
        const error = new HttpError("You cant block yourself", 422);
        return next(error);
    }

    try {
        bannedUser = await User.findById(userId);
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (!bannedUser) {
        const error = new HttpError("User not found", 404);
        return next(error);
    }

    if (type === "ban") {
        bannedUser.isBanned = true;
        try {
            await bannedUser.save();
        } catch (err) {
            const error = new HttpError("User ban failed", 500);
            return next(error);
        }

        res.status(200).json({ message: "Banned" });
    }

    if (type === "unban") {
        bannedUser.isBanned = false;
        try {
            await bannedUser.save();
        } catch (err) {
            const error = new HttpError("User unban failed", 500);
            return next(error);
        }

        res.status(200).json({ message: "Unbanned" });
    }
};

const getUserById = async (req, res, next) => {
    const userId = req.params.userId;

    let foundUser;

    try {
        foundUser = await User.findById(userId);
    } catch (err) {
        const error = new HttpError("Failed to get user", 500);
        return next();
    }

    res.json({ user: foundUser.toObject({ getters: true }) });
};

const editUser = async (req, res, next) => {
    const {name, role} = req.body;
    const userId = req.params.userId;
    console.log(role)
    const acceptedRoles = {
        "user": "user",
        "admin": "admin"
    };

    if (!acceptedRoles[role]) {
        const error = new HttpError('Role is invalid. It has to be user or admin');
        return next(error);
    }

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that', 403);
        return next(error);
    }

    if (user.role === 'admin' && role === 'user' && user._id.toString() === userId.toString()) {
        const error = new HttpError("You cant downgrade yourself");
        return next(error);
    }

    let updatedUser;

    try {
        updatedUser = await User.findById(userId);
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    updatedUser.name = name;
    updatedUser.role = role;

    try {
        await updatedUser.save();
    } catch (err) {
        const error = new HttpError(
            "Something went wrong, could not update user",
            500
        );
        return next(error);
    }

    res.status(201).json({ user: updatedUser.toObject({ getters: true }) });
}

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
exports.banUser = banUser;
exports.getUserById = getUserById;
exports.editUser = editUser;