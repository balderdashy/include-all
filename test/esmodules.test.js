/**
 * Module dependencies
 */

var assert = require('assert');
var path = require('path');
var loader = require('../');



describe('es modules, default is a default export', function(){


  it('should return the default export as default - lowlevel', function () {

    var modules = loader({
      dirname: path.resolve(__dirname, './fixtures/es-modules'),
      filter: /(.+\.js)$/
    })

    assert.deepEqual(modules, {
      'module-default.js': true,
      'sub-dir': {
        'another-module.js': true
      }
    });

  });//</should return the default export as default - lowlevel>


});//</describe>

