/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// var stdlib = require('sails-stdlib');
// var EmailAddresses = stdlib('emailaddresses');
// var Passwords = stdlib('passwords');
// var Gravatar = stdlib('gravatar');
// ^^^ Commented out because this is a test and these dependencies aren't ACTUALLY installed.

module.exports = {

  login: function(req, res) {

    console.log();
    console.log('login');
    console.log('================================================');
    console.log('using criteria:',[{
      email: req.param('email')
    }, {
      username: req.param('username')
    }]);
    console.log('req.session.userId is:',req.session.userId);
    // console.log('req.session is:',req.session);
    // console.log('req.session.id is:',req.session.id);

    User.findOne({
      or: [{
        email: req.param('email')
      }, {
        username: req.param('username')
      }]
    }, function (err, foundUser) {
      if (err) return res.negotiate(err);
      if (!foundUser) return res.notFound();

      Passwords.checkPassword({
        passwordAttempt: req.param('password'),
        encryptedPassword: foundUser.encryptedPassword
      }).exec({

        error: function(err) {
          return res.negotiate(err);
        },

        incorrect: function() {
          return res.notFound();
        },

        success: function() {

          if (foundUser.deleted) {
            return res.forbidden("'Your our account has been deleted.  Please visit http://brushfire.io/restore to restore your account.'");
          }

          if (foundUser.banned) {
            return res.forbidden("'Your our account has been banned, most likely for adding dog videos in violation of the Terms of Service.  Please contact Chad or his mother.'");
          }

          // Save user id to the session
          req.session.userId = foundUser.id;
          req.session.someDictionary = {hmmm: 'I wonder'};

          // console.log('Ok it worked.  All logged in w/ user id "'+foundUser.id+'"!  Responding w/ 200...');
          // console.log('btw thats a '+typeof foundUser.id);

          return res.json({hi: 'there', its: 'some data'});

        }
      });
    });
  },

  logout: function(req, res) {
    console.log('LOGOUT!!!');
    if (!req.session.userId) return res.redirect('/');

    User.findOne(req.session.userId, function foundUser(err, user) {
      if (err) return res.negotiate(err);
      if (!user) {
        sails.log.verbose('Session refers to a user who no longer exists.');
        return res.redirect('/');
      }

      req.session.userId = null;

      return res.redirect('/');
    });
  },

  signup: function(req, res) {
    console.log('Signup!');

    if (_.isUndefined(req.param('email'))) {
      return res.badRequest('An email address is required!');
    }

    if (_.isUndefined(req.param('password'))) {
      return res.badRequest('A password is required!');
    }

    if (req.param('password').length < 6) {
      return res.badRequest('Password must be at least 6 characters!');
    }

    if (_.isUndefined(req.param('username'))) {
      return res.badRequest('A username is required!');
    }

    var splitUsername = req.param('username').split(' ').join('-');

    EmailAddresses.validate({
      string: req.param('email'),
    }).exec({
      // An unexpected error occurred.
      error: function(err) {
        return res.serverError(err);
      },
      // The provided string is not an email address.
      invalid: function() {
        return res.badRequest('Doesn\'t look like an email address to me!');
      },
      // OK.
      success: function() {
        Passwords.encryptPassword({
          password: req.param('password'),
        }).exec({

          error: function(err) {
            return res.serverError(err);
          },

          success: function(result) {

            var options = {};

            try {

              options.gravatarURL = Gravatar.getImageUrl({
                emailAddress: req.param('email')
              }).execSync();

            } catch (err) {
              return res.serverError(err);
            }

            options.email = req.param('email');
            options.username = splitUsername;
            options.encryptedPassword = result;
            options.deleted = false;
            options.admin = false;
            options.banned = false;

            User.create(options).exec(function(err, createdUser) {
              if (err) {
                console.log('the error is: ', err.invalidAttributes);

                // Check for duplicate email address
                if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0] && err.invalidAttributes.email[0].rule === 'unique') {

                  // return res.send(409, 'Email address is already taken by another user, please try again.');
                  return res.alreadyInUse(err);
                }

                // Check for duplicate username
                if (err.invalidAttributes && err.invalidAttributes.username && err.invalidAttributes.username[0] && err.invalidAttributes.username[0].rule === 'unique') {

                  // return res.send(409, 'Username is already taken by another user, please try again.');
                  return res.alreadyInUse(err);
                }

                return res.negotiate(err);
              }

              req.session.userId = createdUser.id;

              return res.json(createdUser);
            });
          }
        });
      }
    });
  },

  // profile: function(req, res) {

  //   // Try to look up user using the provided email address
  //   User.findOne(req.param('id')).exec(function foundUser(err, user) {
  //     // Handle error
  //     if (err) return res.negotiate(err);

  //     // Handle no user being found
  //     if (!user) return res.notFound();

  //     // Return the user
  //     return res.json(user);
  //   });
  // },

  // delete: function(req, res) {

  //   if (!req.param('id')) {
  //     return res.badRequest('id is a required parameter.');
  //   }

  //   User.destroy({
  //     id: req.param('id')
  //   }).exec(function(err, usersDestroyed) {
  //     if (err) return res.negotiate(err);
  //     if (usersDestroyed.length === 0) {
  //       return res.notFound();
  //     }
  //     return res.ok();
  //   });
  // },

  removeProfile: function(req, res) {
    console.log('removeProfile!!');

    // if (_.isUndefined(req.param('id'))) {
    //   return res.badRequest('id is a required parameter.');
    // }

    // Added in chapter 10
    // var isMe = req.session.userId == req.param('id');

    // if (!isMe) {
    //   return res.forbidden();
    // } else {

      User.update({
        // id: req.param('id')
        id: req.session.userId
      }, {
        deleted: true
      }, function(err, removedUser) {

        if (err) return res.negotiate(err);
        if (removedUser.length === 0) {
          return res.notFound();
        }

        req.session.userId = null;
        return res.ok();
      });
    // }
  },

  restoreProfile: function(req, res) {

    // Added in chapter 10
    // Must be authenticated
    // if (!req.session.userId) {
    //   return res.redirect('/');
    // }


    User.findOne({
      email: req.param('email')
    }, function foundUser(err, user) {
      if (err) return res.negotiate(err);
      if (!user) return res.notFound();

      Passwords.checkPassword({
        passwordAttempt: req.param('password'),
        encryptedPassword: user.encryptedPassword
      }).exec({

        error: function(err) {
          return res.negotiate(err);
        },

        incorrect: function() {
          return res.notFound();
        },

        success: function() {

          User.update({
            id: user.id
          }, {
            deleted: false
          }).exec(function(err, updatedUser) {

            req.session.userId = user.id;

            return res.json(updatedUser);
          });
        }
      });
    });
  },

  restoreGravatarURL: function(req, res) {

    try {

      var restoredGravatarURL = gravatarURL = Gravatar.getImageUrl({
        emailAddress: req.param('email')
      }).execSync();

      return res.json(restoredGravatarURL);

    } catch (err) {
      return res.serverError(err);
    }
  },

    // // Added chapter 10
    // // If you the user hasn't logged in
    // if (!req.session.userId) {
    //   return res.forbidden('You are not permitted to perform this action.');
    // }

    // // Added chapter 10
    // // Look up the user whose gravatar is being restored
    // if (_.isUndefined(req.param('email'))) {
    //   return res.badRequest('Malformed request.');
    // }

    // Added chapter 10
    // Does the current user match the user whose gravatar is being restored?
  //   User.findOne({email: req.param('email')}).exec(function(err, foundUser){

  //     // If no user is found, send not found status.
  //     if (!foundUser) {
  //       return res.notFound();
  //     }

  //     if (err) {
  //       return res.negotiate(err);
  //     }

  //     // If current user does not match found user send forbidden status.
  //     var isMe = req.session.userId == foundUser.id;
  //     if (!isMe) {
  //       return res.forbidden('You are not permitted to perform this action.');
  //     }

  //     try {

  //       var restoredGravatarURL = gravatarURL = Gravatar.getImageUrl({
  //         emailAddress: req.param('email')
  //       }).execSync();

  //       return res.json(restoredGravatarURL);

  //     } catch (err) {
  //       return res.serverError(err);
  //     }
  //   });
  // },

  updateProfile: function(req, res) {

    // // Added chapter 10
    // // If you the user hasn't logged in
    // if (!req.session.userId) {
    //   return res.forbidden('You are not permitted to perform this action.');
    // }

    // // Added Chapter 10
    // // If current user does not match found user send forbidden status.
    // var isMe = req.session.userId == req.param('id');
    //   if (!isMe) {
    //     return res.forbidden('You are not permitted to perform this action.');
    //   }

  //   User.update({
  //     id: req.param('id')
  //   }, {
  //     gravatarURL: req.param('gravatarURL')
  //   }, function(err, updatedUser) {

  //     if (err) return res.negotiate(err);

  //     return res.json(updatedUser);

  //   });
  // },

    User.update({
      id: req.session.userId
    }, {
      gravatarURL: req.param('gravatarURL')
    }, function(err, updatedUser) {

      if (err) return res.negotiate(err);

      return res.json(updatedUser);

    });
  },

  changePassword: function(req, res) {

    // // Added chapter 10
    // // If you the user hasn't logged in
    // if (!req.session.userId) {
    //   return res.forbidden('You are not permitted to perform this action.');
    // }

    // // If current user does not match found user send forbidden status.
    // var isMe = req.session.userId == req.param('id');
    //   if (!isMe) {
    //     return res.forbidden('You are not permitted to perform this action.');
    //   }

    // Fallback to client-side required validation
    if (_.isUndefined(req.param('password'))) {
      return res.badRequest('A password is required!');
    }

    // Fallback to client-side length check validation
    if (req.param('password').length < 6) {
      return res.badRequest('Password must be at least 6 characters!');
    }

    Passwords.encryptPassword({
      password: req.param('password'),
    }).exec({
      error: function(err) {
        return res.serverError(err);
      },
      success: function(result) {

        User.update({
          // id: req.param('id')
          id: req.session.userId
        }, {
          encryptedPassword: result
        }).exec(function(err, updatedUser) {
          if (err) {
            return res.negotiate(err);
          }
          return res.json(updatedUser);
        });
      }
    });
  },

  adminUsers: function(req, res) {

    User.find().exec(function(err, users) {

      if (err) return res.negotiate(err);

      return res.json(users);

    });
  },

    // // Added Chapter 10
    // if (!req.session.userId) return res.forbidden();

    // Added Chapter 10
  //   User.findOne({id: req.session.userId}).exec(function(err, foundUser){
  //     if (err) return res.negotiate(err);
  //     if (!foundUser) return res.notFound();

  //     if (!foundUser.admin) {
  //       return res.forbidden();
  //     } else {
  //       User.find().exec(function(err, users) {

  //         if (err) return res.negotiate(err);

  //         return res.json(users);

  //       });
  //     }
  //   });
  // },

  updateAdmin: function(req, res) {

    User.update(req.param('id'), {
      admin: req.param('admin')
    }).exec(function(err, update) {

      if (err) return res.negotiate(err);

      return res.ok();
    });
  },

  //   // Added chapter 10

  //   // if (!req.session.userId) return res.forbidden();

  //   // if (!req.session.userId) return res.forbidden();

  //   if (_.isUndefined(req.param('id'))) return res.badRequest();

  //   if (_.isUndefined(req.param('admin'))) return res.badRequest();

  //   User.findOne({id: req.session.userId}).exec(function(err, foundUser){
  //     if (err) return res.negotiate(err);
  //     if (!foundUser) return res.notFound();

  //     if (!foundUser.admin) {
  //       return res.forbidden();
  //     } else {
  //       User.update(req.param('id'), {
  //         admin: req.param('admin')
  //       }).exec(function(err, update) {

  //         if (err) return res.negotiate(err);

  //         return res.ok();
  //       });
  //     }
  //   });
  // },

  updateBanned: function(req, res) {
    User.update(req.param('id'), {
      banned: req.param('banned')
    }).exec(function(err, update) {
      if (err) return res.negotiate(err);
      return res.ok();
    });
  },

  //   // Added chapter 10
  //   if (!req.session.userId) return res.forbidden();

  //   if (!req.session.userId) return res.forbidden();

  //   if (_.isUndefined(req.param('id'))) return res.badRequest();

  //   if (_.isUndefined(req.param('banned'))) return res.badRequest();

  //   User.findOne({id: req.session.userId}).exec(function(err, foundUser){
  //     if (err) return res.negotiate(err);
  //     if (!foundUser) return res.notFound();

  //     if (!foundUser.admin) {
  //       return res.forbidden();
  //     } else {
  //       User.update(req.param('id'), {
  //         banned: req.param('banned')
  //       }).exec(function(err, update) {
  //         if (err) return res.negotiate(err);
  //         return res.ok();
  //       });
  //     }
  //   });
  // },

  updateDeleted: function(req, res) {
    User.update(req.param('id'), {
      deleted: req.param('deleted')
    }).exec(function(err, update) {
      if (err) return res.negotiate(err);
      return res.ok();
    });
  }

    // // Added chapter 10
    // if (!req.session.userId) return res.forbidden();

    // if (!req.session.userId) return res.forbidden();

    // if (_.isUndefined(req.param('id'))) return res.badRequest();

    // if (_.isUndefined(req.param('deleted'))) return res.badRequest();

    // User.findOne({id: req.session.userId}).exec(function(err, foundUser){
    //   if (err) return res.negotiate(err);
    //   if (!foundUser) return res.notFound();

    //   if (!foundUser.admin) {
    //     return res.forbidden();
    //   } else {
    //     User.update(req.param('id'), {
    //       deleted: req.param('deleted')
    //     }).exec(function(err, update) {
    //       if (err) return res.negotiate(err);
    //       return res.ok();
    //     });
    //   }
    // });
  // }
};
