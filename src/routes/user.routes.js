const express = require('express');
const userController = require('../controllers/user.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const upload = require('../middlewares/fileUpload.middleware');

const router = express.Router();

router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    userController.registerUser
);

router.route("/login").post(
    userController.loginUser
);

router.route("/logout").post(
    verifyJWT,
    userController.logoutUser
);

router.route("/refresh-token").post(
    userController.refreshAccessToken
);

router.route("/change-password").post(
    verifyJWT,
    userController.changeCurrentPassword
);

router.route("/current-user").get(
    verifyJWT,
    userController.getCurrentUser
);

router.route("/update-profile").patch(
    verifyJWT,
    userController.updateProfileDetails
);

router.route("/upload-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    userController.updateUserAvatar
);

router.route("/upload-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    userController.updateUserCoverImage
);

router.route("/channel/:userName").get(
    verifyJWT,
    userController.getUserChannelProfile
);

router.route("/watch-history").get(
    verifyJWT,
    userController.getWatchHistory
);

module.exports = router;