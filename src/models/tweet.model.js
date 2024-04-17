const mongoose = require("monggose");

const Schema = mongoose.Schema;

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });


const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;