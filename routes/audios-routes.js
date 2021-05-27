const express = require("express");
const { check } = require("express-validator");

const audiosController = require("../controllers/audios-controller");
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.post('/search', audiosController.searchAudioByName);

router.get("/:audioId", audiosController.getAudioById);

router.get('/', audiosController.getAllAudios);

router.use(isAuth);

router.delete("/:audioId", audiosController.deleteAudio);

router.patch(
    "/:audioId",
    [check("title").not().isEmpty(), check("artist").not().isEmpty()],
    audiosController.updateAudio
);

router.post(
    "/:audioId/comments",
    [check("text").not().isEmpty()],
    audiosController.createComment
);

module.exports = router;
