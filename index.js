/**
 * Module dependencies
 */

var path = require('path');
var fs = require('fs');




/**
 * includeAll()
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @required {String} dirname
 *           The initial directory.
 *
 * @optional {RegExp} filter
 *           A regular expression used to filter modules by filenames.
 *
 * @optional {RegExp} pathFilter
 *           A regular expression used to filter modules by their entire paths.
 *
 * @optional {RegExp} excludeDirs
 *           A regular expression used to EXCLUDE directories by name.
 *
 * @optional {Number} depth
 *           The maximum depth to traverse.  A depth of `1` means only the top-level contents of the initial directory will be returned.
 *           By default, there is no max depth (it is infinite).
 *
 * @optional {Boolean} optional
 *           If set, then if an error is thrown when attempting to list directory contents, ignore it, fail silently, and continue.
 *           @default false
 *
 * @optional {Boolean} ignoreRequireFailures
 *           If set, then if an error is thrown when attempting to require a module, ignore the error, fail silently, and continue.
 *           @default false
 *
 * @optional {Boolean} dontLoad
 *           If set, then just set the right-hand side in the dictionary to `true` (rather than a module reference).
 *           @default false
 *
 * @optional {Boolean} force
 *           When set, any past require cache entry will be cleared before re-requiring a module.
 *           @default true
 *
 * @optional {Boolean} keepDirectoryPath
 *           TODO: document
 *           Note that flattenDirectories must also be set to `true` for this to work.
 *           @default false
 *
 * @optional {Boolean} flattenDirectories
 *           TODO: document
 *           @default false
 *
 * @optional {Boolean} markDirectories
 *           TODO: document
 *           @default false
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @return {Dictionary}
 *         A dictionary containing all the modules that were loaded.
 *         Keys are filenames and values are either module references
 *         or `true` (if `dontLoad` was passed in.)
 *
 * For example, this might return:
 *
 * ```
 * {
 *   api: {
 *     controllers: {
 *       UserController: { find: function (req, res) {} },
 *       PetController: { create: function (req, res) {} },
 *     },
 *     models: {
 *       User: { schema: false },
 *       Pet: { attributes: {} },
 *     },
 *     policies: {
 *       isLoggedIn: function (req, res) {}
 *     },
 *   }
 * }
 * ```
 *
 * OR it might return:
 *
 * ```
 * {
 *   api: {
 *     controllers: {
 *       UserController: true,
 *       PetController: true
 *     },
 *     models: {
 *       User: true,
 *       Pet: true
 *     },
 *     policies: {
 *       isLoggedIn: true
 *     }
 *   }
 * }
 * ```
 */

module.exports = function includeAll(options) {
  options = options || {};

  // Assertions
  if (typeof options.dirname === 'undefined') {
    throw new Error('`dirname` is required');
  }
  if (typeof options.filter !== 'undefined' && (typeof options.filter !== 'object' || options.filter === null)) {
    throw new Error('If specified, `filter` must be a RegExp.');
  }
  if (typeof options.excludeDirs !== 'undefined' && (typeof options.excludeDirs !== 'object' || options.excludeDirs === null)) {
    throw new Error('If specified, `excludeDirs` must be a RegExp.');
  }


  // Sane defaults:
  if (typeof options.force === 'undefined') {
    options.force = true;
  }
  if (!options.filter) {
    options.filter = /(.*)/;
  }


  var modules = (function _recursivelyIncludeAll(thisDirname, _depth){

    var _modules = {};

    // Bail out if our counter has reached the desired depth
    // originally indicated by the user in `options.depth`.
    if (typeof options.depth !== 'undefined' && _depth >= options.depth) {
      return;
    }

    // List files in the specified directory.
    var files;
    try {
      files = fs.readdirSync(thisDirname);
    }
    catch (e) {
      if (options.optional) { return {}; }
      else {
        var dirNotFoundErr = new Error('`include-all` could not scan directory (`' + thisDirname + '`) could not be scanned for files.\nDetails:' + e.stack);
        dirNotFoundErr.code = 'include-all:DIRECTORY_NOT_FOUND';
        dirNotFoundErr.originalError = e;
        throw dirNotFoundErr;
      }
    }


    // Iterate through files in the current directory
    files.forEach(function (file) {

      var filepath = path.join(thisDirname, file);
      // `path.join()` does not preserve `./`-- but since that
      // symbols has a special meaning when at the beginning of
      // a `require()` path, we bring it back here.
      if (thisDirname.match(/^\.\//) && !filepath.match(/^\.\//)) {
        filepath = './' + filepath;
      }

      // For directories, continue to recursively include modules
      if (fs.statSync(filepath).isDirectory()) {

        // Ignore explicitly excluded directories
        if (options.excludeDirs && file.match(options.excludeDirs)) { return; }

        // Recursively call `_recursivelyIncludeAll` on this child directory.
        _modules[file] = _recursivelyIncludeAll(
          filepath, // new dirname for recursive step
          _depth+1  // new depth for recursive step
        );

        if (options.markDirectories || options.flattenDirectories) {
          _modules[file].isDirectory = true;
        }

        if (options.flattenDirectories) {

          _modules = (function _recursivelyFlattenDirectories(_modules, accum, thisPath) {
            accum = accum || {};
            Object.keys(_modules).forEach(function (keyName) {
              if (typeof(_modules[keyName]) !== 'object' && typeof(_modules[keyName]) !== 'function') {
                return;
              }

              var nextPath;
              if (thisPath) {
                nextPath = path.join(thisPath, keyName);
                // `path.join()` does not preserve `./`-- but since that
                // symbols has a special meaning when at the beginning of
                // a `require()` path, we bring it back here.
                if (thisPath.match(/^\.\//) && !nextPath.match(/^\.\//)) {
                  nextPath = './' + nextPath;
                }
              }
              else { nextPath = keyName; }

              if (_modules[keyName].isDirectory) {
                _recursivelyFlattenDirectories(_modules[keyName], accum, nextPath);
              } else {
                accum[options.keepDirectoryPath ? nextPath : keyName] = _modules[keyName];
              }
            });
            return accum;
          })(_modules);

        }//</if options.flattenDirectories>

      }//</if (this is a directory)>

      // Otherwise, this is a file.
      // So we'll go ahead and add a key for it in our module map.
      else {

        // Key name for module.
        var keyName;

        // Filename filter
        if (options.filter) {
          var match = file.match(options.filter);
          if (!match) { return; }
          keyName = match[1];
        }

        // ADDITIONAL full relative path filter.
        // (only relevant if we made it past the first filter.
        //  Note that the key name from here takes precedence.)
        if (options.pathFilter) {
          // Peel off just the relative path (remove the initial dirname)
          var relPath = filepath.replace(options.dirname, '');

          // Make sure exactly one slash exists on the left side of path.
          relPath = relPath.replace(/^\/*/, '/');

          var pathMatch = relPath.match(options.pathFilter);
          if (!pathMatch) { return; }
          keyName = pathMatch[2];
        }

        // If `dontLoad` is true, then don't load anything--
        // instead just set the RHS to `true`.
        if (options.dontLoad) {
          _modules[keyName] = true;
        }
        // Otherwise, dontLoad is falsey (the default), so we'll load
        // this module into memory using `require()`
        else {

          // If `force: true` was set, wipe out the previous contents from
          // this spot in the require cache before proceeding.
          if (options.force) {
            var resolved = require.resolve(filepath);
            if (require.cache[resolved]) { delete require.cache[resolved]; }
          }

          // Require the module.
          try {
            _modules[keyName] = require(filepath);
          } catch (e) {
            // Skip this module silently if `ignoreRequireFailures` is enabled.
            if (options.ignoreRequireFailures) { return; }
            else {
              e.originalErrorCode = e.code;
              e.code = 'include-all:COULD_NOT_REQUIRE';
              // Maintain the original stack trace at the top lvl (because it might have a useful line number from app-level code)
              // but prepend an additional message to clarify what's going on.
              e.stack = '`include-all` attempted to `require('+filepath+')`, but an error occurred:: \nDetails:' + e.stack;
              throw e;
            }
          }//</catch>
        }

      }//</else (this is a file)>
    });//</each file>


    // Pass these modules back to the previous recursive step.
    return _modules;
  })(options.dirname, 0);
  // ^set up dirname, and start the depth counter at 0


  // Now that all modules have been gathered up, pass map of modules back to userland code.
  return modules;

};
