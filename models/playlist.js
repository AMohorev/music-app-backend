const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    tracks: [{
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Audio'
    }],
    owner: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

module.exports = mongoose.model('Playlist', playlistSchema);