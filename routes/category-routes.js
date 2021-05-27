const express = require("express");
const { check } = require("express-validator");

const categoriesController = require("../controllers/categories-controller");
const isAuth = require('../middleware/isAuth');
const fileUpload = require('../middleware/fileUpload');

const router = express.Router();

router.get("/", categoriesController.getCategories);

router.get("/:ctgId", categoriesController.getCategoryById);

router.use(isAuth);

router.post(
    "/",
    [check("name").not().isEmpty()],
    categoriesController.createCategory
);

router.post(
    "/:ctgId",
    fileUpload.fields([{name: 'image', maxCount: 1}, {name: 'audio', maxCount: 1}]),
    [check("title").not().isEmpty(), check("artist").not().isEmpty()],
    categoriesController.postAudioIntoCategory
);

router.patch(
    "/:ctgId",
    [check("name").not().isEmpty()],
    categoriesController.updateCategory
);

router.delete("/:ctgId", categoriesController.deleteCategory);

module.exports = router;
