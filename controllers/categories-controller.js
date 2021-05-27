const HttpError = require("../models/HttpError");
const Category = require("../models/category");
const Audio = require("../models/audio");
const User = require('../models/user');

const getCategories = async (req, res, next) => {
    let categories;

    try {
        categories = await Category.find({});
    } catch (err) {
        const error = new HttpError("Could not receive categories", 500);
        return next(error);
    }

    res.json({
        categories: categories.map((category) =>
            category.toObject({ getters: true })
        ),
    });
};

const createCategory = async (req, res, next) => {
    const { name } = req.body;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user");
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that');
        return next(error);
    }

    const createdCategory = new Category({
        name,
        tracks: [],
    });

    try {
        await createdCategory.save();
    } catch (err) {
        const error = new HttpError("Could not create category", 500);
        return next(error);
    }

    res.status(201).json({
        ctgId: createdCategory.id,
        ctgName: createdCategory.name,
    });
};

const getCategoryById = async (req, res, next) => {
    let ctgId = req.params.ctgId;

    let categoryTracks;

    try {
        categoryTracks = await Category.findById(ctgId).populate("tracks");
    } catch (err) {
        const error = new HttpError("Could not get tracks for category", 500);
        return next(error);
    }

    return res.json({
        category: {
            categoryId: categoryTracks.id,
            categoryName: categoryTracks.name,
            categoryTracks: categoryTracks.tracks.map((track) =>
                track.toObject({ getters: true })
            ),
        },
    });
};

const postAudioIntoCategory = async (req, res, next) => {
    let ctgId = req.params.ctgId;
    let foundCtg;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user");
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that');
        return next(error);
    }

    const { title, artist} = req.body;

    const image = req.files.image[0].path.replace(/\\/g, "/");
    const audio = req.files.audio[0].path.replace(/\\/g, "/");

    const createdAudio = new Audio({
        title,
        artist,
        image: image,
        track: audio,
        comments: [],
        category: ctgId,
    });

    try {
        foundCtg = await Category.findById(ctgId);
    } catch (err) {
        const error = new HttpError("Could not get category", 500);
        return next(error);
    }

    if (!foundCtg) {
        const error = new HttpError("Category not found", 404);
        return next(error);
    }

    try {
        await createdAudio.save();
        foundCtg.tracks.push(createdAudio);
        await foundCtg.save();
    } catch (err) {
        const error = new HttpError("Could not create audio", 500);
        console.log(err);
        return next(error);
    }

    res.status(201).json({ audio: createdAudio });
};

const updateCategory = async (req, res, next) => {
    const { name } = req.body;

    const ctgId = req.params.ctgId;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user");
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that');
        return next(error);
    }

    let updatedCtg;
    try {
        updatedCtg = await Category.findById(ctgId);
    } catch (err) {
        const error = new HttpError("Could not get category", 500);
        return next(error);
    }

    updatedCtg.name = name;

    try {
        await updatedCtg.save();
    } catch (err) {
        const error = new HttpError(
            "Something went wrong, could not update category",
            500
        );
        return next(error);
    }

    res.status(201).json({ category: updatedCtg.toObject({ getters: true }) });
};

const deleteCategory = async (req, res, next) => {
    const ctgId = req.params.ctgId;
    let category;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user");
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that');
        return next(error);
    }

    try {
        category = await Category.findById(ctgId);
    } catch (err) {
        const error = new HttpError("Could not find category", 500);
        return next(error);
    }

    if (!category) {
        return next(new HttpError("Category not found", 404));
    }

    try {
        if (category.tracks.length) {
            await Audio.deleteMany({ _id: { $in: category.tracks } });
        }
        await Category.findByIdAndDelete(ctgId);
    } catch (err) {
        const error = new HttpError("Could not delete category", 500);
        return next(error);
    }

    res.status(200).json({ message: "Category deleted" });
};

exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.getCategoryById = getCategoryById;
exports.postAudioIntoCategory = postAudioIntoCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
