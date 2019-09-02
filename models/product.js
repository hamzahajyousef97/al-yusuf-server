const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    image: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    }
},{
    timestamps: true
});

const productSchema = new Schema({
    nameTR: {
        type: String,
        required: true
    },
    nameAR: {
        type: String,
        required: true
    },
    descriptionTR: {
        type: String,
        required: true
    },
    descriptionAR: {
        type: String,
        required: true
    },
    images: [imageSchema]
},{
    timestamps: true
});

var Products = mongoose.model('Products', productSchema);

module.exports = Products;