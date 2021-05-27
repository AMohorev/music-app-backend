const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const audioSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    track: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        required: true,
        default: 0
    },
    likes: {
        type: Number,
        required: true,
        default: 0
    },
    comments: [{
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Comment'
    }],
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
        required: true
    }
})

module.exports = mongoose.model('Audio', audioSchema);