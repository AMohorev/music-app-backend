const fs = require('fs');

const HttpError = require("../models/HttpError");
const Audio = require("../models/audio");
const Comment = require("../models/comment");
const User = require("../models/user");
const Playlist = require("../models/playlist");
const Category = require("../models/category");

const getAllAudios = async (req, res, next) => {
    let audios;
    try {
        audios = await Audio.find({});
    } catch (err) {
        const error = new HttpError("Could not get audios", 500);
        return next(error);
    }

    res.json({
        audios: audios.map((audio) => audio.toObject({ getters: true })),
    });
};

const getAudioById = async (req, res, next) => {
    const audioId = req.params.audioId;
    let audio;

    try {
        audio = await Audio.findById(audioId).populate("comments");
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    if (!audio) {
        const error = new HttpError("Audio not found", 404);
        return next(error);
    }

    try {
        audio.views += 1;
        await audio.save();
    } catch (err) {
        const error = new HttpError("Failed to save audio", 500);
        return next(error);
    }

    res.json({ audio: audio.toObject({ getters: true }) });
};

const updateAudio = async (req, res, next) => {
    const audioId = req.params.audioId;
    const { title, artist } = req.body;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user for update", 500);
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that', 403);
        return next(error);
    }

    let updatedAudio;
    try {
        updatedAudio = await Audio.findById(audioId);
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    updatedAudio.title = title;
    updatedAudio.artist = artist;

    try {
        await updatedAudio.save();
    } catch (err) {
        const error = new HttpError("Could not update audio", 500);
        return next(error);
    }

    res.status(201).json({ audio: updatedAudio.toObject({ getters: true }) });
};

const deleteAudio = async (req, res, next) => {
    const audioId = req.params.audioId;
    let audio;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user for delete", 500);
        return next(error);
    }

    if (user.role !== 'admin') {
        const error = new HttpError('You dont have permission to do that', 403);
        return next(error);
    }

    try {
        audio = await Audio.findById(audioId);
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    if (!audio) {
        return next(new HttpError("Audio not found"), 404);
    }

    try {
        if (audio.comments.length) {
            await Comment.deleteMany({ _id: { $in: audio.comments } });
        }
        await Playlist.updateMany({}, { $pull: { tracks: audioId } });
        await Category.updateMany({}, { $pull: { tracks: audioId } });
        await Audio.findByIdAndDelete(audioId);
    } catch (err) {
        const error = new HttpError("Could not delete audio", 500);
        return next(error);
    }

    fs.unlink(audio.track, (err) => {
        console.log(err);
    });

    fs.unlink(audio.image, (err) => {
        console.log(err);
    });

    res.status(200).json({ message: "Audio was deleted" });
};

const createComment = async (req, res, next) => {
    const audioId = req.params.audioId;
    const { text, author } = req.body;
    let foundAudio;

    const createdComment = new Comment({
        text,
        author
    });
    try {
        foundAudio = await Audio.findById(audioId);
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    if (!foundAudio) {
        return next(new HttpError("Audio not found", 404));
    }

    try {
        await createdComment.save();
        foundAudio.comments.push(createdComment);
        await foundAudio.save();
    } catch (err) {
        const error = new HttpError("Could not create comment", 500);
        //console.log(err);
        return next(error);
    }

    res.status(201).json({ comment: createdComment });
};

const searchAudioByName = async (req, res, next) => {
    const title = req.body.title;
    let foundAudios;
    try {
        foundAudios = await Audio.find({title: title});
    } catch (err) {
        console.log(err);
        const error = new HttpError("Could not get audios", 500);
        return next(error);
    }

    res.json({
        audios: foundAudios.map((audio) => audio.toObject({ getters: true })),
    });
}

exports.getAudioById = getAudioById;
exports.updateAudio = updateAudio;
exports.deleteAudio = deleteAudio;
exports.createComment = createComment;
exports.getAllAudios = getAllAudios;
exports.searchAudioByName = searchAudioByName;
