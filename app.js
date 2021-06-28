const song = require('./model/song.js');
const user = require('./model/user.js');

const   bodyParser      = require('body-parser'),
        mongoose        = require('mongoose'),
        express         = require('express'),
        app             = express(),
        LocalStrategy   = require('passport-local'),
        passport        = require('passport'),
        User            = require('./model/user.js'),
        Song            = require('./model/song.js'),
        multer          = require('multer'),
        path            = require('path'),
        storage         = multer.diskStorage({
                            destination: function(req, file, callback){
                callback(null, './public/uploads/');
            },
            filename: function(req, file, callback){
                callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
            }
        }),
        fileFilter = function(req, file, callback){
            if(file.fieldname == 'cover'){
                if(!file.originalname.match(/.(jpg|jpeg|png|gif)$/i)) {
                    return callback(new Error('Only JPG, JPEG, PNG and GIF image files are allowed only!'), false);
                }
            } else if(file.fieldname == 'file'){
                if(!file.originalname.match(/.(mp3)$/i)) {
                    return callback(new Error('Only MP3 files are allowed!'), false);
                } 
            }
            callback(null, true);
        },
        upload = multer({storage: storage, fileFilter: fileFilter});

app.set('view engine','ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + 'public'));
app.use(require('express-session')({
    secret: 'secret is always secret.',
    resave: false,
    saveUninitialized: false
}));

mongoose.connect('mongodb://localhost/Musix', {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => app.listen(3000, function()
    { console.log('Server started'); }))
    .catch((err) => console.log(err));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});

app.post('/register', function(req, res){
    var newUser = new User({username: req.body.username,email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function(){
            res.redirect('/main');
        });
    });
});

app.post('/login', passport.authenticate('local',
    {
        successRedirect: '/main',
        failureRedirect: '/login'
    }), function(res, res){       
});

app.post('/addsong', upload.any([{name: 'cover'}, {name: 'file'}]), function(req, res){
    console.log(req.body);
    req.body.song.cover='/uploads/'+ req.files[0].filename;
    req.body.song.file='/uploads/'+ req.files[1].filename;
    Song.create(req.body.song, function(err, song){
        if(err) {
            console.log(err);
        }
        else {
            res.redirect('/main');
        }
    })
})



app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/main', isLoggedIn, async function(req,res){
    var favoritelist = new Array(req.user.favorite.length);
    for(let i=0;i< req.user.favorite.length ; i++){
        favoritelist[i] = req.user.favorite[i].toString();
    }
    const newrel = await Song.find({}).sort({"_id":-1}).limit(6).exec();
    const song = await Song.find({}).limit(6).exec();
    const mostfav = await Song.find({}).sort({"viewer":-1}).limit(6).exec();
    const random = await Song.aggregate([{$sample:{size:6}}]).exec();
    res.render('index.ejs', {song:song,songnew:newrel,getfav:favoritelist,fav:mostfav,randsong:random});
})
   

app.get('/', function(req, res) {
    res.render('home.ejs');
})

app.get('/login', function(req, res) {
    res.render('login.ejs');
})

app.get('/register', function(req, res) {
    res.render('register.ejs');
})

app.get('/main', function(req, res) {
    res.render('index.ejs');
})

app.get('/favorite', function(req, res) {
    User.findById(req.user.id).populate('favorite').exec(function(err,getsongdata){
        if(err){
        console.log(err);
        }
        else if(getsongdata){
            console.log(getsongdata.favorite);
            res.render('favorite.ejs',{favdata: getsongdata.favorite});
        }
    })
})

app.get('/song/:songid',async function(req,res){
    const songdesc = await Song.findById(req.params.songid).exec();
    res.render('songdt.ejs',{song:songdesc});
})

app.get('/addsong', function(req, res) {
    res.render('addsong.ejs');
})

app.get('/profile', function(req, res) {
    res.render('profile.ejs');
})

app.get('/usermanager',async function(req,res) {
    var allUser = await User.find({}).exec();
    res.render('usermanager.ejs',{user:allUser});

})

app.get('/usermanager/remove/:id' ,function(req,res){
    User.findByIdAndDelete(req.params.id,function(err,getremove){
        if(err){
            console.log(err);
        }
        else if(getremove){
            res.redirect('/usermanager');
        }
    })
})

app.get('/premium', function(req, res) {
    res.render('premium.ejs');
})

app.get('/search/:key', function(req, res) {
    var key = req.params.key;
    var capkey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    Song.find(
        {$or:[{name:{$regex:'.*' + key + '.*'}},{name:{$regex:'.*' + key.toUpperCase() + '.*' }},{name:{$regex:'.*' + key.toLowerCase()}},{name:{$regex:'.*' + capkey + '.*'}}]}, function(err,words){
        if(err) {
            console.log(err);
        }
        else if(words) { 
            Song.find(
                {$or:[{name:{$regex:'.*' + key + '.*'}},{name:{$regex:'.*' + key.toUpperCase() + '.*' }},{name:{$regex:'.*' + key.toLowerCase()}},{name:{$regex:'.*' + capkey + '.*'}}]}, function(err,sorted){
                if(err) {
                    console.log(err);
                }
                else {
                    res.render('search.ejs',{word:words,sorted:sorted});
                }
                }).sort({"name": 1})
        }
        })
    
})

app.get('/favorite/add/:id', function(req, res) {
    var id = req.params.id;
    User.findById(req.user.id, function(err,getusers){
        if(err) {
            console.log(err);
        }
        else if (getusers) {
            song.findById(id,function(err,getsong){
                if(err){
                console.log(err);
                }
                else if(getsong){
                    getusers.favorite.push(getsong.id);
                    getusers.save();
                    Song.findByIdAndUpdate(getsong.id,{$inc:{viewer:1}},function(err,updatefav){
                        if(err){
                            console.log(err);
                        }
                        else if(updatefav){
                            res.redirect('/main');
                        }
                    })
                }
                else {
                    res.redirect('/main');
                }
            })
        }
    })
})

app.get('/favorite/remove/:id', isLoggedIn, function(req,res){
    var id = req.params.id;
    User.findByIdAndUpdate(req.user.id,{$pull: {favorite:id}},function(err,delfav){
        if(err){
            console.log(err);
        }
        else if(delfav){
            Song.findByIdAndUpdate(id,{$inc:{viewer:-1}},function(err,updatefav){
                if(err){
                    console.log(err);
                }
                else if(updatefav){
                    res.redirect('/main');
                }
            })
        }
    })
})


app.post('/search', function(req, res){
    var search = req.body.key;
    res.redirect('/search/' + search);
})

app.get("/premiumget", function(req, res){
    var rankup = {$set: {rank : "Premium" }};
    User.findByIdAndUpdate(req.user._id,{$set: {rank : "Premium" }}, function(err,user){
        if(err) {
            console.log(err);
        }
        else {
            res.redirect("/main");
        }
    })
})

app.get('/egg', function(req, res) {
    res.render('egg.ejs');
})


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}