/**
 * Module dependencies
 */

var helpBuildDictionary = require('./lib/help-build-dictionary');
var helpIncludeAllSync = require('./lib/help-include-all-sync');


/**
 * includeAll
 *
 * An easy way to include all node.js modules within a directory.
 *
 * > Used by the module loader in Sails core.
 */


/**
 * Build a dictionary of named modules
 * (default usage-- see options in `README.md`)
 *
 * @param {Dictionary} options
 */

module.exports = function includeAllSync(options) {
  // This is the original, pre-v1 `include-all` usage.
  return helpIncludeAllSync(options);
};


//////////////////////////////////////////////////////////////////////////////
// The four methods below are all originally from sails-build-dictionary.
// They are asynchronous, and besides defaulting certain options, they do a
// handful of extra things.  So it's more than just options getting defaulted!
//////////////////////////////////////////////////////////////////////////////


/**
 * Build a dictionary of named modules
 * (responds with an error if the container cannot be loaded)
 *
 * WARNING: THIS PARTICULAR CONVENIENCE METHOD WILL LIKELY BE DEPRECATED.
 * (it's not actually being used anywhere in core)
 *
 * @async
 * @param {Dictionary} options
 * @param {Function} cb
 */

module.exports.required = function(options, cb) {
  return helpBuildDictionary(options, cb);
};



/**
 * Build a dictionary of named modules
 * (fails silently-- returns {} if the container cannot be loaded)
 *
 * @async
 * @param {Dictionary} options
 * @param {Function} cb
 */

module.exports.optional = function(options, cb) {
  options.optional = true;
  return helpBuildDictionary(options, cb);
};



/**
 * Build a dictionary indicating whether the matched modules exist
 * (fails silently-- returns {} if the container cannot be loaded)
 *
 * @async
 * @param {Dictionary} options
 * @param {Function} cb
 */

module.exports.exists = function(options, cb) {
  options.optional = true;
  options.dontLoad = true;
  return helpBuildDictionary(options, cb);
};



/**
 * Build a single module dictionary by extending {} with the contents of each module
 * (fail silently-- returns {} if the container cannot be loaded)
 *
 * @async
 * @param {Dictionary} options
 * @param {Function} cb
 */

module.exports.aggregate = function(options, cb) {
  options.aggregate = true;
  options.optional = true;
  return helpBuildDictionary(options, cb);
};




//////////////////////////////////////////////////////////////////////////////
// Finally, this last method is sort of like a recursive `ls`.
// Similarly, it's more or less just a synchronous version of `.exists()`,
// but with a few more specific hard-coded overrides.
//////////////////////////////////////////////////////////////////////////////


/**
 * Build a flat dictionary of the matched modules, where the keys are the
 * paths, and the values are `true` (fails silently-- returns {} if the
 * container cannot be loaded)
 *
 * @param {Dictionary} options
 * @returns {Dictionary}
 */

module.exports.scanSync = function(options) {

  // Higher level overrides.
  options.flatten = true;
  options.keepDirectoryPath = true;

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Note: the combination of the following overrides make this
  // more or less equivalent to `.exists()`-- but synchronous.
  // Not all options work... instead, this is really designed
  // for a slightly different kind of use case-- where you want
  // to recursively, synchronously stat modules, rather than
  // include them.
  options.optional = true;
  options.dontLoad = true;
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // Finally, some defaults:
  if (!options.excludeDirs) {
    options.excludeDirs = /^\.(git|svn)$/;
  }
  if (!options.depth) {
    options.depth = 10;
  }
  if (!options.filter) {
    options.filter = /(.+)$/;
  }

  // Now call the low-lvl helper.
  return helpIncludeAllSync(options);
};

