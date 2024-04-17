const mongoose = require('mongoose');
const DB_NAME = require("../constants");

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MONGODB CONNECT !! DB HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB Connection Error", error);
        process.exit(1);
    }
}

module.exports = connectDb;
