# include-all

An easy way to include all node.js modules within a directory.

This is a fork of felixge's awesome module, require-all (https://github.com/felixge/node-require-all) which adds the ability to mark a call to `include-all` as **optional**.


## Usage

```js

var controllers = require('include-all')({
  dirname     :  __dirname + '/controllers',
  filter      :  /(.+Controller)\.js$/,
  excludeDirs :  /^\.(git|svn)$/
});

// controllers now is an object with references to all modules matching the filter
// for example:
// { HomeController: function HomeController(req, res) {...}, ...}


var models = require('include-all')({
  dirname     :  __dirname + '/models',
  filter      :  /(.+)\.js$/,
  excludeDirs :  /^\.(git|svn)$/,
  optional    :  true
});

// models now is an object with references to all modules matching the filter
// but if __dirname + /models doesn't exist, instead of throwing an error, {} is returned
// for example:
// { User: { attributes: {}, adapter: 'dirty', ...}, ...}
```
