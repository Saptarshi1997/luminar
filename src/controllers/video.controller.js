const Video = require("../models/video.model");
const User = require("../models/user.model");
const Like = require("../models/like.model");
const responseHandler = require("../utils/responseHandler");
const errorHandler = require("../utils/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const { uploadToCloudinary, deleteFileFromCloudinary } = require("../utils/fileUpload")
const Comment = require("../models/comment.model");
const Playlist = require("../models/playlist.model");
const mongoose = require("mongoose");


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, searchText, sortBy, sortType } = req.query

    console.log("req.queryryryryry:::>>>>", JSON.stringify(req.query));
    //TODO: get all videos based on query, sort, pagination
    const userId = req.user?._id;
    // Prepare the options for pagination
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy ? { [sortBy]: sortType === "desc" ? -1 : 1 } : { createdAt: -1 }
    };

    console.log("options:::>>>>", JSON.stringify(options));

    // Prepare the conditions for filtering
    const conditions = {};
    if (searchText) {
        // Add conditions for searching by title, description, etc.
        conditions.title = { $regex: searchText, $options: "i" }; // Case-insensitive search for title
        // You can add conditions for other fields similarly
        // For example:
        conditions.description = { $regex: searchText, $options: "i" }; // Case-insensitive search for description
    }

    if (userId) {
        conditions.owner = userId; // Filter videos by user ID
    }

    // Perform the database query
    const videos = await Video.aggregatePaginate(conditions, options);

    console.log("videos:::>>>>", JSON.stringify(videos));

    for (let video of videos.docs) {
        const likes = await Like.find({ video: video._id }).populate(
            "likedBy",
            "fullName username"
        );
        console.log("likessssss::beeforoeoeoe:>>>>", JSON.stringify(likes));

        video.likes = likes.map((like) => like.likedBy);

        console.log("likessssss:afterrrrr::>>>>", JSON.stringify(video.likes));

        // Populate 'owner' field
        const owner = await User.findById(video.owner).select("fullName username");
        console.log("ownerrrrrrr::beforeee:>>>>", JSON.stringify(video.owner));

        video.owner = owner;

        console.log("ownerrrrrrr:aftetetete::>>>>", JSON.stringify(video.owner));

    }

    // Return the paginated list of videos
    if (!videos) {
        console.log("error in fetching videos");
        throw new errorHandler(500, "error in fetching video");
    }

    return res.status(200).json(new responseHandler(201, videos, "videos fetched successfully"));
})

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new errorHandler(400, "Title and description are required");
    }

    const userId = req.user?._id;

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    // Upload video and thumbnail to Cloudinary
    const videoFile = await uploadToCloudinary(videoFileLocalPath, "video");
    const thumbnail = await uploadToCloudinary(thumbnailLocalPath, "image");

    if (!videoFile) {
        throw new errorHandler(500, "Failed to upload video");
    }

    if (!thumbnail) {
        throw new errorHandler(500, "Failed to upload thumbnail");
    }


    const videoDuration = videoFile?.duration;
    // console.log("video duration", videoDuration);

    // Create the video document in the database
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoDuration,
        owner: userId,
    });


    return res.status(201).json(new responseHandler(201, video, "Video published successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId.trim()) {
        throw new errorHandler(400, "Invalid video id");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new errorHandler(400, "Invalid video id");
    }

    const numberOfLikes = await Like.countDocuments({ video: videoId });
    const numberOfComments = await Comment.countDocuments({ video: videoId });

    const video = await Video.findById(videoId)
        .populate({
            path: "owner",
            select: "fullName username",
        })
        .select("-__v -updatedAt");

    if (!video) {
        throw new errorHandler(404, "Video not found");
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { watchHistory: videoId },
        },
        { new: true }
    );

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        { new: true }
    );

    // Dynamically add numberOfLikes to the video object
    const videoWithNumberOfLikesAndComments = {
        ...video.toObject(),
        numberOfLikes: numberOfLikes,
        numberOfComments: numberOfComments,
    };

    return res.status(200).json(new responseHandler(200, videoWithNumberOfLikesAndComments, "Video found"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const userId = req.user?._id;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new errorHandler(400, "Avatar file is required");
    }

    if (!videoId.trim()) {
        throw new errorHandler(400, "Invalid video id");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new errorHandler(400, "Invalid video id");
    }

    const videoOwner = await Video.findById(videoId).select("owner thumbnail").exec();
    if (!videoOwner || videoOwner.owner.toString() !== userId.toString()) {
        throw new errorHandler(403, "Video Not found || You are not owner of this video");
    }

    await deleteFileFromCloudinary(videoOwner.thumbnail, false);

    const thumbnail = await uploadToCloudinary(thumbnailLocalPath, "image");

    if (!thumbnail.secure_url) {
        throw new errorHandler(400, "error while uploading avatar");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.secure_url,
            },
        },
        { new: true }
    );

    return res.status(200).json(new responseHandler(200, video, "Thumbnail updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const userId = req.user?._id;

    if (!videoId.trim() || !mongoose.isValidObjectId(videoId)) {
        throw new errorHandler(400, "Invalid video id");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new errorHandler(404, "Video not found");
    }

    // Check if the authenticated user is the owner of the video
    if (video.owner.toString() !== userId.toString()) {
        throw new errorHandler(403, "You are not the owner of this video");
    }

    try {
        // Delete all likes associated with the video
        await Like.deleteMany({ video: videoId });

        // Find all comments associated with the video
        const comments = await Comment.find({ video: videoId });
        const commentsIds = comments.map((comment) => comment._id); // taking out the commentId
        // Loop through each comment

        await Like.deleteMany({ comment: { $in: commentsIds } });
        await Comment.deleteMany({ video: videoId });


        await Playlist.updateMany(
            { videos: videoId },
            { $pull: { videos: videoId } }
        );


        // Remove the video from all users' watch history
        await User.updateMany(
            { watchHistory: videoId },
            { $pull: { watchHistory: videoId } }
        );

        // Delete the video from Cloudinary
        await deleteFileFromCloudinary(video.videoFile, true);
        await deleteFileFromCloudinary(video.thumbnail, false);
        // Finally, delete the video itself
        await Video.findByIdAndDelete(videoId);

        return res.status(200).json(new responseHandler(200, null, "Video deleted"));
    } catch (error) {
        throw new errorHandler(500, "Error while deleting video");
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id;
    if (!videoId.trim()) {
        throw new errorHandler(400, "Invalid video id");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new errorHandler(400, "Invalid video id");
    }

    const videoOwner = await Video.findById(videoId).select("owner").exec();
    if (!videoOwner || videoOwner.owner.toString() !== userId.toString()) {
        throw new errorHandler(403, "Video Not found || You are not owner of this video");
    }

    // Find the video by its ID
    const video = await Video.findById(videoId).select("-owner").exec();

    if (!video) {
        throw new errorHandler(404, "Video not found");
    }

    // Toggle the isPublished status
    video.isPublished = !video.isPublished;

    // Save the updated video document
    const updatedVideo = await video.save();

    return res.status(200).json(new responseHandler(200, updatedVideo, "Video publish status updated"));
})

module.exports = { getAllVideos, publishVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }