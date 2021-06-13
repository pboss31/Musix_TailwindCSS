const   bodyParser      = require('body-parser'),
        mongoose        = require('mongoose'),
        express         = require('express'),
        app             = express(),
        LocalStrategy   = require('passport-local'),
        passport        = require('passport'),
        User            = require('./model/user.js'),
        Song            = require('./model/song.js')
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
    var newUser = new User({username: req.body.username});
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

app.get('/main', isLoggedIn, function(req,res){
    Song.find({}, function(err, img){
        if(err) {
            console.log(err);
        }
        else { 
            res.render('index.ejs', {send:img});
        }
    })

});

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

app.get('/album', function(req, res) {
    res.render('album.ejs');
})

app.get('/main/songid', function(req, res) {
    res.render('songdt.ejs');
})

app.get('/addsong', function(req, res) {
    res.render('addsong.ejs');
})

app.get('/profile', function(req, res) {
    res.render('profile.ejs');
})


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}