var express = require('express');
const BodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(BodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

router.get('/', cors.corsWithOptions,  authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({})
  .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(user);
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post('/signup', cors.corsWithOptions, (req,res,next) => {
  User.register(new User(
    {
        firstname: req.body.firstname , 
        lastname : req.body.lastname ,
        username : req.body.username ,
        password : req.body.password,
        email : req.body.email,
        telnum : req.body.telnum, 
        admin : req.body.admin,
    }),
    req.body.password, (err ,user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
      console.log(err)
    }
    else {
      if (req.body.firstname)
        user.firstname = req.body.firstname;
      if (req.body.lastname)
        user.lastname = req.body.lastname;
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return false;
        }
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login', cors.corsWithOptions, (req, res,next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unseccessful!', err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unseccessful!', err: 'Could not log in user!'});
      }

      var token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Seccessful!', token: token});
    });
  }) (req, res, next);
});

router.post('/loginAdmin', cors.corsWithOptions, (req,res,next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unseccessful!', err: info});
    }

      req.logIn(user, (err) => {
        if (req.user.admin === true) {
          if (err) {
            res.statusCode = 401;
            console.log("hamza");
            res.setHeader('Content-Type', 'application/json');
            res.json({success: false, status: 'Login Unseccessful!', err: 'Could not log in user!'});
          }

          var token = authenticate.getToken({_id: req.user._id});
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Login Seccessful!', token: token});
        }
        else {
          var err = new Error('You are not Admin to log in');
          err.status = 403;
          next(err);
        }
      });
  }) (req, res, next);
});

router.get('/logout', cors.corsWithOptions,  (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are Successfully logged in!'});
  }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', { session: false}, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if(!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT invalid!', success: false, err: info});
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({status: 'JWT Valid!', success: true, user: user});
    }
  }) (req, res);
});

router.get('/:userId', cors.corsWithOptions, (req,res,next) => {
  User.findById(req.params.userId)
    .then((user) => {
      if(user.admin === true || JSON.stringify(user._id) == JSON.stringify(req.user._id)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
      }
      else {
        var err = new Error('You are not authorized to do this operation!');
        err.status = 403;
        next(err);
      }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.get('/:userId', authenticate.verifyUser, cors.corsWithOptions, (req,res,next) => {
  User.findById(req.params.userId)
    .then((user) => {
      if(req.user.admin === true || JSON.stringify(user._id) == JSON.stringify(req.user._id)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
      }
      else {
        var err = new Error('You are not authorized to do this operation!');
        err.status = 403;
        next(err);
      }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/:userId', authenticate.verifyUser, cors.corsWithOptions, (req,res,next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on /users/' + req.params.userId);
});

router.put('/:userId', authenticate.verifyUser, cors.corsWithOptions, (req,res,next) => {
  User.findById(req.params.userId)
  .then((user) => {
    if (req.user.admin === true || JSON.stringify(user._id) == JSON.stringify(req.user._id)) {
      if (user != null) {
        if (req.body.firstname) {
          user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        if (req.body.username) {
          user.username = req.body.username;
        }
        if (req.body.password) {
          user.password = req.body.password;
        }
        if (req.body.email) {
          user.email = req.body.email;
        }
        if (req.body.telnum) {
          user.telnum = req.body.telnum;
        }
        // if (req.body.admin) {
        //   user.admin = req.body.admin;
        // }
        user.save()
        .then((user) => {
          console.log('user updated: ', user);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(user);
        }, (err) => next(err))
      }
      else {
        err = new Error('User ' + req.params.userId + ' not found ');
        err.status = 404;
        return next(err);  
      }
    }
    else {
      var err = new Error('You are not authorized to update this User!');
      err.status = 403;
      next(err);
    }

  }, (err) => next(err))
  .catch((err) => next(err));
});

router.delete('/:userId', authenticate.verifyUser, cors.corsWithOptions, (req,res,next) => {
  User.findById(req.params.userId)
  .then((user) => {
    if (req.user.admin === true || JSON.stringify(user._id) == JSON.stringify(req.user._id)) {
      if (user != null) {
        user.remove();
        user.save()
        .then((user) => {
          User.find({})
          .populate('comments.author')
          .then((user) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(user);
          })
        }, (err) => next(err));
      }
      else {
        err = new Error('User ' + req.params.userId + ' not found ');
        err.status = 404;
        return next(err);  
      }
    }
    else {
      var err = new Error('You are not authorized to update this User!');
      err.status = 403;
      next(err);
    }

  }, (err) => next(err))
  .catch((err) => next(err));
});


module.exports = router;