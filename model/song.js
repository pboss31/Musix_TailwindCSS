var mongoose = require("mongoose");

var SongSchema = new mongoose.Schema
(
    {
        name: String,
        // lyrics: String,
        artist: String,
        // album: String,
        genre: String,
        cover: String,
        file: String,
        favorites: String
    }
);

module.exports = mongoose.model("song", SongSchema);