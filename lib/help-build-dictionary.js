/**
 * Module dependencies
 */

var path = require('path');
var _ = require('@sailshq/lodash');
var mergeDictionaries = require('merge-dictionaries');
var helpIncludeAllSync = require('./help-include-all-sync');



/**
 * helpBuildDictionary()
 *
 * A helper.
 *
 * Build a dictionary of "identifiable" modules.
 *
 * Go through each module in the source directory according to these options.
 * This primarily relies on include-all, with a few extra bits of logic, including
 * the determination of each module's "identity".  Tolerates non-existent files/directories
 * by ignoring them.
 *
 * > Note:
 * > This helper includes stronger conventions than the base includeAll usage.
 * > For example, it defaults to excluding `.git` and `.svn` folders.
 * > It also exposes extra options which are not supported by the base, synchronous includeAll.
 *
 * @param {Dictionary} options [see README.md for details]
 * @param {Function} cb
 *
 * @private
 */
module.exports = function helpBuildDictionary (options, cb) {

  // Defaults
  options.replaceVal = options.replaceVal || '';

  // Deliberately exclude source control directories
  if (!options.excludeDirs) {
    options.excludeDirs = /^\.(git|svn)$/;
  }

  var files;
  try {
    files = helpIncludeAllSync(options);
  } catch (e) { return cb(e); }

  // Start building the module dictionary
  var dictionary = {};

  // Iterate through each module in the set
  try {
    _.each(files, function (module, filename) {

      // Build the result dictionary by merging all of the target modules.
      // Note: Each module must export a dictionary in order for this to work
      // (e.g. for building a configuration dictionary from a set of config files)
      if (options.aggregate) {

        // Check that source module is a valid dictionary
        if (!_.isPlainObject(module)) {
          throw new Error('When using `aggregate`, modules must export dictionaries.  But module (`'+filename+'`) is invalid:' + module);
        }

        // Merge module into dictionary, using our custom merge strategy for the merge-dictionaries module
        // to prevent issues with empty dictionaries and arrays (see highlvl "edge case" tests)
        mergeDictionaries(dictionary, module);

        return;
      }

      // Keyname is how the module will be identified in the returned module tree
      var keyName = filename;

      // If a module is found but marked as `undefined`,
      // don't actually include it (since it's probably unusable)
      if (typeof module === 'undefined') {
        return;
      }

      // Normal case behavior:
      // (i.e. unless the `identity` option is explicitly disabled,
      //  or if `dontLoad` is set)
      if (!options.dontLoad && options.identity !== false) {

        // If no `identity` property is specified in module, infer it from the filename
        if (!module.identity) {
          if (options.replaceExpr) {
            module.identity = filename.replace(options.replaceExpr, options.replaceVal);
          }
          else {
            module.identity = filename;
          }
        }

        // Ensure that the identity and globalId always use forward slashes ("/") for their
        // path separators, even on Windows.  This is so that identities are more clean and
        // predictable.
        // (see https://nodejs.org/dist/latest-v0.10.x/docs/api/path.html#path_path_sep)
        if (path.sep === '\\') {
          module.identity = module.identity.replace(/\\/g, '/');
        }

        // globalId is the name of the variable for this module
        // that e.g. will be exposed globally in Sails unless configured otherwise.

        // Generate `globalId` using the original value of module.identity
        if (!module.globalId) {module.globalId = module.identity;}

        // `identity` is the all-lowercase version
        module.identity = module.identity.toLowerCase();

        // Use the identity for the key name
        keyName = options.useGlobalIdForKeyName ? module.globalId : module.identity;
      }

      if (dictionary[keyName] && !options.allowDuplicateKeys) {
        var e = new Error('Duplicate filename detected: `include-all` attempted to load two files named `' + keyName + '` (case-insensitive).');
        e.code = 'include-all:DUPLICATE';
        e.duplicateIdentity = keyName;
        throw e;
      }

      // >-
      // Now save the module's contents (or `true`, if the `dontLoad` option is set)
      // in our dictionary.
      dictionary[keyName] = module;
    });//</each key/module pair in the module map>
  } catch (e) { return cb(e); }

  // Always return at least an empty dictionary
  dictionary = dictionary || {};

  return cb(undefined, dictionary);
};
