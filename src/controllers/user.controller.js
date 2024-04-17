const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const errorHandler = require("../utils/errorHandler");
const uploadToCloudinary = require("../utils/fileUpload");
const responseHandler = require("../utils/responseHandler");


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new errorHandler(500, "Something went wrong while generating token!")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // empty validation
    // check if user already exists - email, userName
    // check for images & avatar
    // upload them to cloudinary
    // create user object and entry that in db
    // create password and refresh token field from response
    // check for user creation
    // return response

    const { fullName, email, userName, password } = req.body;

    if (fullName === "" || fullName === undefined || fullName === null) {
        throw new errorHandler(400, "Full Name is required!");
    } else if (email === "" || email === undefined || email === null) {
        throw new errorHandler(400, "Email is required!");
    } else if (userName === "" || userName === undefined || userName === null) {
        throw new errorHandler(400, "Username is required!");
    } else if (password === "" || password === undefined || password === null) {
        throw new errorHandler(400, "Password is required!");
    }

    const existingEmailUser = await User.findOne({ email: email });
    if (existingEmailUser) {
        throw new errorHandler(409, `${email} already exists`);
    }

    const existingUsernameUser = await User.findOne({ userName: userName });
    if (existingUsernameUser) {
        throw new errorHandler(409, `${userName} already exists`);
    }

    let avatarLocalPath;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    let avatar = await uploadToCloudinary(avatarLocalPath, "image");
    let coverImage = await uploadToCloudinary(coverImageLocalPath, "image");


    let user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",

    });

    let createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );


    if (!createdUser) {
        throw new errorHandler(500, "Internal Server Error");
    }

    return res.status(201).json(
        new responseHandler(200, createdUser, "User registered successfully!")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // get data from frontend
    // access using userName or email
    // find the user
    // checking the password
    // generating accessToken & refreshToken
    // send tokens using secure cookies

    const { email, password, userName } = req.body;

    if (!(userName || email)) {
        throw new errorHandler(400, "username or email is required!")
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    });

    if (!user) {
        throw new errorHandler(404, "User not exists!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new errorHandler(401, "Wrong password!");
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new responseHandler(200, { user: loggedInUser, refreshToken: refreshToken, accessToken: accessToken }, "User logged in successfully!")
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }


    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
        new responseHandler(200, "User logged out successfully!")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new errorHandler(401, "Unauthorized request token!");
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new errorHandler(401, "Invalid refresh token!");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new errorHandler(401, "Refresh Token is expired!");
        }

        const options = {
            httpOnly: true,
            secure: trur,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return status(200).cookie("accessToken", accessToken).cookie("refreshToken", newRefreshToken).json(
            new responseHandler(
                200,
                { accessToken, newRefreshToken },
                "Access token refreshed successfully!"
            )
        )
    } catch (error) {
        throw new errorHandler(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new errorHandler(400, "Your current password is wrong!")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false, });

    return res.status(200).json(new responseHandler(200, {}, "Password changed successfully!"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new errorHandler("No user Found!");
    }

    return res.status(200).json(new responseHandler(200, { user }, "Current User fetched successfully!"));
})

const updateProfileDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(fullName || email)) {
        throw new errorHandler(400, "All fields are required!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,

            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(new responseHandler(200, { user }, "Profile updated successfully!"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (avatarLocalPath) {
        throw new errorHandler(400, "Avatar is missing!");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath, "image");

    if (!avatar.url) {
        throw new errorHandler(400, "Error while uploading avatar!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(new responseHandler(200, { user }, "Avatar uploaded successfully!"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (coverImageLocalPath) {
        throw new errorHandler(400, "Cover Image is missing!");
    }

    const coverImage = await uploadToCloudinary(coverImageLocalPath, "image");

    if (!coverImage.url) {
        throw new errorHandler(400, "Error while uploading Cover Image!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(new responseHandler(200, { user }, "Cover Image uploaded successfully!"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    if (!userName || !userName.trim()) {
        throw new errorHandler(400, "User name is missing!");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToChannelsCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                subscribedToChannelsCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new errorHandler(404, "Channel does not exists!");
    }

    return res.status(200).json(new responseHandler(200, channel[0], "User channel fetched successfully!"));
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup: {
                from: 'Videos',
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "Users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new responseHandler(200, user[0].watchHistory, "Watch History fetched successfully!"))
})

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateProfileDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };