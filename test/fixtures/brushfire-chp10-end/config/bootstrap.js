/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {

  // Return the number of records in the video model
  // Video.count().exec(function(err, numVideos) {
  //   if (err) {
  //     return cb(err);
  //   }

  //   // If there's at least one log the number to the console.
  //   if (numVideos > 0) {
  //     // return cb();
  //     return createTestUsers();
  //   }

  //   // Add machinepack-youtube as a depedency
  //   var Youtube = require('machinepack-youtube');

  //   // List Youtube videos which match the specified search query.
  //   Youtube.searchVideos({
  //     query: 'grumpy cat',
  //     apiKey: 'ADD YOUR GOOGLE ID HERE',
  //     limit: 15
  //   }).exec({
  //     // An unexpected error occurred.
  //     error: function(err) {
  //       console.log('the error', err);

  //     },
  //     // OK.
  //     success: function(foundVideos) {
  //       _.each(foundVideos, function(video) {
  //         video.src = 'https://www.youtube.com/embed/' + video.id;
  //         delete video.description;
  //         delete video.publishedAt;
  //         delete video.id;
  //         delete video.url;
  //       });

  //       Video.create(foundVideos).exec(function(err, videoRecordsCreated) {
  //         if (err) {
  //           return cb(err);
  //         }
  //         // return cb();
  //         return createTestUsers();
  //       });
  //     },
  //   });
  // });

  function createTestUsers() {

    var Passwords = require('machinepack-passwords');
    var Gravatar = require('machinepack-gravatar');

    var testUsers = [
    {email: 'sailsinaction@gmail.com', username: 'sails-in-action', password: 'abc123', admin: true},
    {email: 'nikolateslaidol@gmail.com', username: 'nikola-tesla', password: 'abc123', admin: false}
    ];

    _.forEach(testUsers, function(n){
      User.findOne({
        email: n.email
      }).exec(function(err, foundUser){
        if (foundUser) {
          return;
        }

      Passwords.encryptPassword({
        password: n.password,
      }).exec({
        error: function(err) {
          return cb(err);
        },
        success: function(result) {

          var options = {};

          try {
            options.gravatarURL = Gravatar.getImageUrl({
              emailAddress: n.email
            }).execSync();

          } catch (err) {
            return cb(err);
          }

          options.email = n.email;
          options.encryptedPassword = result;
          options.username = n.username;
          options.deleted = false;
          options.admin = n.admin;
          options.banned = false;
          User.create(options).exec(function(err, createdUser) {
            if (err) {
              return cb(err);
            }
            return;
          });
        }
      });
    });
  });
    return cb();
  }

  createTestUsers();

};
