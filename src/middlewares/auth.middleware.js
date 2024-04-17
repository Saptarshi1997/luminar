const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const errorHandler = require("../utils/errorHandler");



const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            throw new errorHandler(401, "Unauthorized Token!");
        }
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new errorHandler(401, "Invalid token");
        };

        req.user = user;
        next();
    } catch (error) {
        throw new errorHandler(401, error?.message || "Invalid access token!")
    }
})

module.exports = verifyJWT