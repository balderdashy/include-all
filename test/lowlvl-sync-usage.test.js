/**
 * Module dependencies
 */

var path = require('path');
var assert = require('assert');
var includeAll = require('../');



describe('basic usage of synchronous, low-level function', function(){

  it('should have loaded stuff as expected', function (){

    var controllers = includeAll({
      dirname: path.join(__dirname, '/fixtures/lowlvl/controllers'),
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
      },

      'level1': {
        'level2': {
          'level3': {
            'nestedController': {
              nestingLevel: 3
            }
          }
        }
      }
    });


    if (process.version > 'v0.6.0') {
      var mydir = includeAll({
        dirname: path.join(__dirname, '/fixtures/lowlvl/mydir'),
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
      dirname: path.join(__dirname, '/fixtures/lowlvl/filterdir'),
      filter: /(.+)\.js$/
    });

    assert(unfiltered['.svn']);
    assert(unfiltered['root']);
    assert(unfiltered['sub']);

    var excludedSvn = includeAll({
      dirname: path.join(__dirname + '/fixtures/lowlvl/filterdir'),
      filter: /(.+)\.js$/,
      excludeDirs: /^\.svn$/
    });

    assert.equal(excludedSvn['.svn'], undefined);
    assert.ok(excludedSvn['root']);
    assert.ok(excludedSvn['sub']);

    var excludedSvnAndSub = includeAll({
      dirname: path.join(__dirname, '/fixtures/lowlvl/filterdir'),
      filter: /(.+)\.js$/,
      excludeDirs: /^(\.svn|sub)$/
    });

    assert.equal(excludedSvnAndSub['.svn'], undefined);
    assert.ok(excludedSvnAndSub['root']);
    assert.equal(excludedSvnAndSub['sub'], undefined);

  });//</it should have loaded stuff as expected>

  describe('with flatten: true and keepDirectoryPath: false', function() {

    it('should flatten nested folders into one level', function (){
      var controllers = includeAll({
        dirname: path.join(__dirname, '/fixtures/lowlvl/controllers'),
        filter: /(.+Controller)\.js$/,
        flatten: true
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
        },

        'nestedController': {
          nestingLevel: 3
        }
      });
    });

  });

  describe('with flatten: true and keepDirectoryPath: true', function() {

    it('should flatten nested folders into one level, keeping the directory path as part of the identity', function (){
      var controllers = includeAll({
        dirname: path.join(__dirname, '/fixtures/lowlvl/controllers'),
        filter: /(.+Controller)\.js$/,
        flatten: true,
        keepDirectoryPath: true
      });

      var nestKey = path.join('level1', 'level2', 'level3', 'nestedController');

      var expected = {

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

      };

      expected[nestKey] = { nestingLevel: 3};

      assert.deepEqual(controllers, expected);
    });

  });

});//</describe :: basic usage of synchronous, low-level function>

