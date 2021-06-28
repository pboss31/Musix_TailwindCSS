var mongoose = require("mongoose");

var SongSchema = new mongoose.Schema
(
    {
        name: String,
        artist: String,
        genre: String,
        cover: String,
        file: String,
        viewer:{
            type: Number,
            default:0
        },
        favorite: String,
        
    }
);

module.exports = mongoose.model("song", SongSchema);