/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  // connection: 'myPostgresqlServer',
  // schema: 'true',

  attributes: {

    email: {
      type: 'string',
      email: 'true',
      unique: 'true'
    },

    username: {
      type: 'string',
      unique: 'true'
    },

    encryptedPassword: {
      type: 'string'
    },

    gravatarURL: {
      type: 'string'
    },

    deleted: {
      type: 'boolean'
    },

    admin: {
      type: 'boolean'
    },

    banned: {
      type: 'boolean'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmation;
      delete obj.encryptedPassword;
      return obj;
    }
  }
}
