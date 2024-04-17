const cloudinary = require("cloudinary").v2;
const fs = require("fs");


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadToCloudinary = async (localFilePath, resourceType) => {
    try {
        if (!localFilePath) {
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: resourceType })
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFileFromCloudinary = async (url, isVideo) => {
    try {
        if (!url) {
            return; // Exit the function if url is not provided
        }
        const publicId = url.split("/").pop().split(".")[0]; // Extract the public ID

        // Set the resource type based on the asset type
        const resourceType = isVideo ? 'video' : 'image';

        // Use Cloudinary's destroy method to delete the asset
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        console.log(`File ${url} deleted from Cloudinary`);
    } catch (error) {
        console.error(`Error deleting file from Cloudinary: ${error.message}`);
        throw error;
    }
};

module.exports = { uploadToCloudinary, deleteFileFromCloudinary };