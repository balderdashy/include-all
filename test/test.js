/**
 * Module dependencies
 */

var assert = require('assert');
var includeAll = require('../');





var controllers = includeAll({
  dirname: __dirname + '/controllers',
  filter: /(.+Controller)\.js$/
});

assert.deepEqual(controllers, {
  'main-Controller': {
    index: 1,
    show: 2,
    add: 3,
    edit: 4
  },

  'other-Controller': {
    index: 1,
    show: 'nothing'
  }
});


if (process.version > 'v0.6.0') {
  var mydir = includeAll({
    dirname: __dirname + '/mydir',
    filter: /(.+)\.(js|json)$/
  });

  assert.deepEqual(mydir, {
    foo: 'bar',
    hello: { world: true, universe: 42 },
    sub: {
      config: { settingA: 'A', settingB: 'B' },
      yes: true
    }
  });
}

var unfiltered = includeAll({
  dirname: __dirname + '/filterdir',
  filter: /(.+)\.js$/
});

assert(unfiltered['.svn']);
assert(unfiltered['root']);
assert(unfiltered['sub']);

var excludedSvn = includeAll({
  dirname: __dirname + '/filterdir',
  filter: /(.+)\.js$/,
  excludeDirs: /^\.svn$/
});

assert.equal(excludedSvn['.svn'], undefined);
assert.ok(excludedSvn['root']);
assert.ok(excludedSvn['sub']);

var excludedSvnAndSub = includeAll({
  dirname: __dirname + '/filterdir',
  filter: /(.+)\.js$/,
  excludeDirs: /^(\.svn|sub)$/
});

assert.equal(excludedSvnAndSub['.svn'], undefined);
assert.ok(excludedSvnAndSub['root']);
assert.equal(excludedSvnAndSub['sub'], undefined);
