const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    telnum: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
},{
    timestamps: true
});

var Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;