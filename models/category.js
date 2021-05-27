const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    tracks: [{
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Audio'
    }]
})

module.exports = mongoose.model('Category', categorySchema);