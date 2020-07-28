const mongoose = require('./db');

const PlaylistSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    autor: {
        type: String,
        required: true
    },
    thumb: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const Playlist = mongoose.model('Playlist', PlaylistSchema);

module.exports = Playlist;