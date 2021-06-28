var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    profile:{
        type: String,
        default: "/media/jojonaja1.png"
    },
    rank :{
        type: String,
        default: "Member"
    },
    favorite: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref : "song"
        }
    ]
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', UserSchema);