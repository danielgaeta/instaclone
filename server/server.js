var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var path = require('path');
var request = require('request');
var qs = require('qs');

var config = require('./config');

var User = mongoose.model('User', new mongoose.Schema({
  github: { type: String, index: true },
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  displayName: String,
  username: String,
  fullName: String,
  picture: String,
  accessToken: String
}));
 
mongoose.connect(config.MONGO_URI);
 
var app = express();
 
app.set('port', process.env.PORT || 3000);
app.use(cors({credentials: true, origin: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

function createJWT(user) {
  var payload = {
    exp: moment().add(14, 'days').unix(),
    iat: moment().unix(),
    sub: user._id
  };
 
  return jwt.encode(payload, config.tokenSecret);
}

function isAuthenticated(req, res, next) {
  if (!(req.headers && req.headers.authorization)) {
    return res.status(400).send({ message: 'You did not provide a JSON Web Token in the Authorization header.' });
  }
 
  var header = req.headers.authorization.split(' ');
  var token = header[1];
  var payload = jwt.decode(token, config.tokenSecret);
  var now = moment().unix();
 
  if (now > payload.exp) {
    return res.status(401).send({ message: 'Token has expired.' });
  }
 
  User.findById(payload.sub, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User no longer exists.' });
    }
 
    req.user = user;
    next();
  })
}

app.post('/auth/login', function(req, res) {
  User.findOne({ email: req.body.email }, ' password', function(err, user) {
    if (!user) {
      return res.status(401).send({ message: { email: 'Incorrect email' } });
    }
 
    bcrypt.compare(req.body.password, user.password, function(err, isMatch) {
      if (!isMatch) {
        return res.status(401).send({ message: { password: 'Incorrect password' } });
      }
 
      user = user.toObject();
      delete user.password;
 
      var token = createToken(user);
      res.send({ token: token, user: user });
    });
  });
});

app.post('/auth/signup', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      return res.status(409).send({ message: 'Email is already taken.' });
    }
 
    var user = new User({
      email: req.body.email,
      password: req.body.password
    });
 
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(user.password, salt, function(err, hash) {
        user.password = hash;
 
        user.save(function() {
          var token = createToken(user);
          res.send({ token: token, user: user });
        });
      });
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
app.post('/auth/github', function(req, res) {
  var accessTokenUrl = 'https://github.com/login/oauth/access_token';
  var userApiUrl = 'https://api.github.com/user';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GITHUB_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
    accessToken = qs.parse(accessToken);
    var headers = { 'User-Agent': 'Satellizer' };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        User.findOne({ github: profile.id }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
          }
          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, config.TOKEN_SECRET);
          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.github = profile.id;
            user.picture = user.picture || profile.avatar_url;
            user.displayName = user.displayName || profile.name;
            user.save(function() {
              var token = createJWT(user);
              res.send({ token: token });
            });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ github: profile.id }, function(err, existingUser) {
          if (existingUser) {
            var token = createJWT(existingUser);
            return res.send({ token: token });
          }
          var user = new User();
          user.github = profile.id;
          user.picture = profile.avatar_url;
          user.displayName = profile.name;
          user.save(function() {
            var token = createJWT(user);
            res.send({ token: token });
          });
        });
      }
    });
  });
});

app.get('/api/repos', isAuthenticated, function(req, res) {
  var reposUrl = 'https://api.github.com/orgs/uptaketech/repos';
  var params = { access_token: req.user.accessToken };
 
  request.get({ url: reposUrl, qs: params, json: true }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body.data);
    }
  });
});

app.get('/api/commits/:repo', isAuthenticated, function(req, res, next) {
  var Url = 'https://api.github.com/orgs/uptaketech/repos' + req.params.id;
  var params = { access_token: req.user.accessToken };
 
  request.get({ url: mediaUrl, qs: params, json: true }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body.data);
    }
  });
});

 
app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});