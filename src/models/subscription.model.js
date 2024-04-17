const mongoose = require("monggose");

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

const Subscription = mongoose.model('User', subscriptionSchema);

module.exports = Subscription;