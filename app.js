var express        = require('express');
var ejs            = require('ejs');
var bodyParser     = require('body-parser')
var monk           = require('monk')
var passport       = require('passport')
var config         = require('./config')
var methodOverride = require('method-override')
var cookieParser   = require('cookie-parser')
var morgan         = require('morgan')
var session        = require('express-session')

var findOrInsert = require('./findOrInsert')
var db = monk(config.connectionString)
var users = db.get('users')
var products = db.get('products')

/***************************************************
 * PASSPORT
/***************************************************/
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: '689225418821-jtqi9v8utm62kk95c5c5rmn2fdfnhrqj.apps.googleusercontent.com',
    clientSecret: 'zhhhUzyaqh7gHYfcgrK2kyBx',
    callbackURL: "http://127.0.0.1:9628/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return findOrInsert(users, { googleId: profile.id })
    .then(function (user) {
      users.updateById(user._id, {
        $set: {
          profile: {
            id: profile.id,
            displayName: profile.displayName,
            name: profile.name,
            emails: profile.emails,
            photos: profile.photos
          }
        }
      })
      .then(function () {
        return done(null, user)
      }, done);
    }, done)
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/***************************************************
 * EXPRESS
 ***************************************************/
var app = express();
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.set('views', __dirname + '/views');
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

/***************************************************
 * ROUTES
 ***************************************************/
app.get('/', function (req, res) {
  products.find({})
    .then(function(products) {
      res.render('index', {
        products: products
      });
    })
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout', function (req, res){
  req.logout();
  res.redirect('/');
});

app.get('/account', ensureAuthenticated, function (req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function (req, res){
  res.render('login', { user: req.user });
});

app.post('/product', function (req, res) {
  products.insert(req.body)
    .then(function (user) {
      res.send().status(200)
    }, function(err) {
      console.error(err)
      res.send('Error inserting new product').status(500)
    })
})


/***************************************************
 * Start
 ***************************************************/
var server = app.listen(9628, function() {
	console.log('Express server listening on port ' + server.address().port);
});
