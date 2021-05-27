const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema ({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8
    },
    image: {
        type: String,
        required: true
    },
    playlists: [{
        type: mongoose.Types.ObjectId, //replace with mongoose.Types.ObjectId
        required: true,
        ref: 'Playlist'
    }],
    role: {
        type: String,
        required: true,
        default: 'user'
    },
    isBanned: {
        type: Boolean,
        required: true,
        default: false
    }
})

module.exports = mongoose.model('User', userSchema);