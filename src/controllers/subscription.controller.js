// import mongoose, { isValidObjectId } from "mongoose"
// import { User } from "../models/user.model.js"
// import { Subscription } from "../models/subscription.model.js"
// import { ApiError } from "../utils/ApiError.js"
// import { ApiResponse } from "../utils/ApiResponse.js"
const asyncHandler = require("../utils/asyncHandler");


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    // const channel = findById(channelId
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}