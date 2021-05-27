const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const fileUpload = require("../middleware/fileUpload");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

router.post(
    "/signup",
    fileUpload.single("image"), //.fields([{name: 'image', maxCount: 1}, {name: 'audio', maxCount: 1}])//
    [
        check("name").not().isEmpty(),
        check("email").normalizeEmail().isEmail(),
        check("password").isLength({ min: 8 }),
    ],
    usersController.signUp
);

router.post("/login", usersController.login);

router.get("/:userId", usersController.getUserById);

router.use(isAuth);

router.get("/", usersController.getUsers);

router.post("/ban", usersController.banUser);

router.patch(
    "/:userId",
    [check("name").not().isEmpty(), check("role").not().isEmpty()],
    usersController.editUser
);

module.exports = router;
