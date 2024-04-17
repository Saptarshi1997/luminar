const express = require('express');
const videoController = require('../controllers/video.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const upload = require('../middlewares/fileUpload.middleware');

const router = express.Router();

router.route("/").get(
    videoController.getAllVideos
);

router.route("/upload-video").post(
    upload.fields([
        { name: "videoFile", maxCount: 1, },
        { name: "thumbnail", maxCount: 1, },

    ]),
    verifyJWT,
    videoController.publishVideo
);

router.route("/:videoId").get(
    verifyJWT,
    videoController.getVideoById
);

router.route("/delete/:videoId").delete(
    verifyJWT,
    videoController.deleteVideo
);

router.route("/update/:videoId").patch(
    upload.single("thumbnail"),
    verifyJWT,
    videoController.updateVideo
);

module.exports = router;