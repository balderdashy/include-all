var path = require('path');
module.exports.databases = {

  someDb: require(path.resolve(__dirname, '..', 'dbmodule.js'))

};
