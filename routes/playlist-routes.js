const express = require("express");
const { check } = require("express-validator");

const isAuth = require('../middleware/isAuth');
const playlistsController = require("../controllers/playlists-controller");

const router = express.Router();

router.use(isAuth);

router.post("/liked/add/:audioId", playlistsController.addTrackIntoFavourite);

router.get("/:playlistId", playlistsController.getPlaylistById);

router.post("/:playlistId", playlistsController.addTrackIntoPlaylist);

router.get("/user/:userId", playlistsController.getPlaylistsByUserId);

router.patch(
    "/:playlistId",
    [check("name").not().isEmpty()],
    playlistsController.updatePlaylist
);

router.delete("/:playlistId", playlistsController.deletePlaylist);

router.post(
    "/",
    [check("name").not().isEmpty()],
    playlistsController.createPlaylist
);

module.exports = router;
