const HttpError = require("../models/HttpError");
const Audio = require("../models/audio");
const User = require("../models/user");
const Playlist = require("../models/playlist");

const getPlaylistById = async (req, res, next) => {
    const playlistId = req.params.playlistId;

    let playlistTracks;

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError("Could not get user");
        return next(error);
    }

    try {
        playlistTracks = await Playlist.findById(playlistId).populate("tracks");
    } catch (err) {
        const error = new HttpError("Could not get playlist tracks", 500);
        return next(error);
    }

    if (playlistTracks.owner.toString() !== user._id.toString()) {
        const error = new HttpError("You dont have permission", 401);
        return next(error);
    }
    return res.json({
        playlist: {
            playlistName: playlistTracks.name,
            owner: playlistTracks.owner,
            playlistTracks: playlistTracks.tracks.map((track) =>
                track.toObject({ getters: true })
            ),
        },
    });
};

const getPlaylistsByUserId = async (req, res, next) => {
    const userId = req.params.userId;

    let userPlaylists;
    try {
        userPlaylists = await User.findById(userId)
            .populate("playlists")
            .populate("tracks");
    } catch (err) {
        const error = new HttpError("Could not get playlists for user", 500);
        return next(error);
    }

    if (!userPlaylists) {
        return next(new HttpError("Playlist for user not found", 404));
    }

    res.json({
        userPlaylists: userPlaylists.playlists.map((plist) =>
            plist.toObject({ getters: true })
        ),
    });
};

const createPlaylist = async (req, res, next) => {
    let { name } = req.body;
    let foundUser;

    try {
        foundUser = await User.findById(req.userData.userId); //change then
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (!foundUser) {
        return next(new HttpError("User not found", 404));
    }

    const createdPlaylist = new Playlist({
        name,
        tracks: [],
        owner: foundUser
    });

    try {
        await createdPlaylist.save();
        foundUser.playlists.push(createdPlaylist);
        await foundUser.save();
    } catch (err) {
        console.log(err);
        const error = new HttpError("Could not create playlist", 500);
        return next(error);
    }

    res.status(201).json({
        playlistId: createdPlaylist.id,
        playlistName: createdPlaylist.name,
    });
};

const addTrackIntoPlaylist = async (req, res, next) => {
    const playlistId = req.params.playlistId;
    const { audioId } = req.body;

    let foundPlaylist;
    try {
        foundPlaylist = await Playlist.findById(playlistId);
    } catch (err) {
        const error = new HttpError("Could not get playlist", 500);
        return next(error);
    }

    if (!foundPlaylist) {
        return next(new HttpError("Playlist not found", 404));
    }

    let foundTrack;
    try {
        foundTrack = await Audio.findById(audioId);
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    if (!foundTrack) {
        return next(new HttpError("Audio not found", 404));
    }

    const isExists = foundPlaylist.tracks.find(track => track.toString() === foundTrack._id.toString());

    if (isExists) {
        const error = new HttpError("You have already added this track into this playlist", 500);
        return next(error);
    }

    try {
        await foundPlaylist.tracks.push(foundTrack);
        foundPlaylist.save();
    } catch (err) {
        const error = new HttpError("Could not add track into playlist", 500);
        return next(error);
    }

    res.status(200).json({ playlist: foundPlaylist });
};

const addTrackIntoFavourite = async (req, res, next) => {
    const audioId = req.params.audioId;

    let foundUser;
    let foundAudio;

    try {
        foundUser = await User.findById(req.userData.userId); //change then
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (!foundUser) {
        return next(new HttpError("User not found", 404));
    }

    try {
        foundAudio = await Audio.findById(audioId); //change then
    } catch (err) {
        const error = new HttpError("Could not get audio", 500);
        return next(error);
    }

    if (!foundAudio) {
        return next(new HttpError("Audio not found", 404));
    }

    let foundPlaylist;
    try {
        foundPlaylist = await Playlist.find({name: "Liked", owner: foundUser._id})
    } catch (err) {
        return next(new HttpError("Failed to get playlist", 500));
    }

    if (foundPlaylist[0].tracks.find(track => track.toString() === foundAudio._id.toString())) {
        const error = new HttpError("You have already liked this track", 422);
        return next(error);
    }

    try {
        foundPlaylist[0].tracks.push(foundAudio);
        foundAudio.likes += 1;
        await foundAudio.save();
        await foundPlaylist[0].save();
    } catch (err) {
        const error = new HttpError('Failed to add liked audio', 500);
        return next(error);
    }

    res.status(201).json({ playlist: foundPlaylist });
}

const updatePlaylist = async (req, res, next) => {
    const { name } = req.body;

    const playlistId = req.params.playlistId;

    let foundUser;

    try {
        foundUser = await User.findById(req.userData.userId); //change then
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (!foundUser) {
        return next(new HttpError("User not found", 404));
    }

    let updatedPlaylist;
    try {
        updatedPlaylist = await Playlist.findById(playlistId);
    } catch (err) {
        const error = new HttpError("Could not get playlist", 500);
        return next(error);
    }

    if (updatedPlaylist.owner.toString() !== foundUser._id.toString()) {
        const error = new HttpError("You dont have permission", 401);
        return next(error);
    }

    updatedPlaylist.name = name;

    try {
        await updatedPlaylist.save();
    } catch (err) {
        const error = new HttpError("Could not update playlist", 500);
        return next;
    }

    res.status(201).json({
        playlist: updatedPlaylist.toObject({ getters: true }),
    });
};

const deletePlaylist = async (req, res, next) => {
    const playlistId = req.params.playlistId;
    let playlist;

    let foundUser;

    try {
        foundUser = await User.findById(req.userData.userId); //change then
    } catch (err) {
        const error = new HttpError("Could not get user", 500);
        return next(error);
    }

    if (!foundUser) {
        return next(new HttpError("User not found", 404));
    }

    try {
        playlist = await Playlist.findById(playlistId);
    } catch (err) {
        const error = new HttpError("Could not get playlist", 500);
        return next(error);
    }

    if (!playlist) {
        return next(new HttpError("Playlist not found", 404));
    }

    if (playlist.owner.toString() !== foundUser._id.toString()) {
        const error = new HttpError("You dont have permission", 401);
        return next(error);
    }

    try {
        await User.updateOne({}, { $pull: { playlists: playlistId } });
        await Playlist.findByIdAndDelete(playlistId);
    } catch (err) {
        const error = new HttpError("Could not delete playlist", 500);
        return next(error);
    }

    res.status(200).json({ message: "Playlist deleted" });
};

exports.getPlaylistById = getPlaylistById;
exports.getPlaylistsByUserId = getPlaylistsByUserId;
exports.createPlaylist = createPlaylist;
exports.addTrackIntoPlaylist = addTrackIntoPlaylist;
exports.addTrackIntoFavourite = addTrackIntoFavourite;
exports.updatePlaylist = updatePlaylist;
exports.deletePlaylist = deletePlaylist;
