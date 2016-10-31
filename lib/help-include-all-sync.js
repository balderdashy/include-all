/**
 * Module dependencies
 */

var path = require('path');
var fs = require('fs');
var _ = require('lodash');



/**
 * helpIncludeAllSync()
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @required {String} dirname
 *           The initial directory.
 *
 * @optional {RegExp} filter
 *           A regular expression used to filter modules by filename.
 *
 * @optional {RegExp} excludeDirs
 *           A regular expression used to EXCLUDE directories by name.
 *           (the opposite of `filter`)
 *
 * @optional {Array} exclude
 *           An array of regular expressions used to certain EXCLUDE relative paths.
 *           (the opposite of the old `pathFilter`)
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
 *           See README
 *           Note that `flatten` must also be set to `true` for this to work.
 *           @default false
 *
 * @optional {Boolean} flatten
 *           See README
 *           @default false
 *
 * @optional {Boolean} markDirectories
 *           TODO: document or deprecate (pretty sure it's the latter)
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

  // Assertions about usage
  if (typeof options.dirname === 'undefined') {
    throw new Error('`dirname` is required');
  }
  if (typeof options.filter !== 'undefined' && (typeof options.filter !== 'object' || options.filter === null)) {
    throw new Error('If specified, `filter` must be a RegExp.');
  }
  if (typeof options.excludeDirs !== 'undefined' && (typeof options.excludeDirs !== 'object' || options.excludeDirs === null)) {
    throw new Error('If specified, `excludeDirs` must be a RegExp.');
  }
  if (typeof options.exclude !== 'undefined' && (typeof options.exclude !== 'object' || options.exclude === null)) {
    throw new Error('If specified, `exclude` must be an array of RegExps.');
  }
  // Deprecations:
  if (typeof options.flattenDirectories !== 'undefined') {
    throw new Error('As of include-all v1.0.1, `flattenDirectories` was replaced with `flatten`.  See https://github.com/balderdashy/include-all#options for more information.');
  }


  // Sane defaults:
  if (typeof options.force === 'undefined') {
    options.force = true;
  }
  if (!options.filter) {
    options.filter = /(.*)/;
  }

  // For readability in the code below, track the initial "dirname" as a local
  // variable called `contextPath`.
  //
  // Here, we also ensure that it is an absolute path.
  var contextPath = path.resolve(options.dirname);


  // Define and invoke a self-calling recursive function.
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

      // Get the relative path of this module.
      // (i.e. peel off just the relative path -- remove the initial dirname)
      var relativePath = path.relative(contextPath, filepath);

      // Relative path "exclude" filter (blacklist)
      if (options.exclude) {
        var shouldBeExcluded = _.any(options.exclude, function (regexp) {
          return relativePath.match(regexp);
        });
        if (shouldBeExcluded) { return; }
      }

      // For directories, continue to recursively include modules
      if (fs.statSync(filepath).isDirectory()) {

        // Ignore explicitly excluded directories
        if (options.excludeDirs && file.match(options.excludeDirs)) { return; }

        // Recursively call `_recursivelyIncludeAll` on this child directory.
        var descendantModules = _recursivelyIncludeAll(
          filepath, // new dirname for recursive step
          _depth+1  // new depth for recursive step
        );

        // If we're flattening, then fold _our_ direct child modules
        // (grandchildren, if you will) onto ourselves.
        if (options.flatten) {
          _.each(descendantModules, function (rhs, grandchildKey){

            if (options.keepDirectoryPath) {
              _modules[path.join(path.basename(relativePath), grandchildKey)] = rhs;
            }
            else {
              if (_modules[grandchildKey]) { throw new Error('Attempting to flatten modules but duplicate key detected (`'+grandchildKey+'`).  Enable `keepDirectoryPath: true` to enable namepspacing based on hierarchy.'); }
              _modules[grandchildKey] = rhs;
            }
          });//</each key in dictionary of all descendant module>
        }
        // Otherwise, we're leaving things denormalized.
        else {
          _modules[file] = descendantModules;
        }

      }//</if (this is a directory)>

      // Otherwise, this is a file.
      // So we'll go ahead and add a key for it in our module map.
      else {

        // Key name for module.
        var keyName;

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // For debugging:
        //
        // console.log('contextPath:',contextPath);
        // console.log('file:',file);
        // console.log('filepath:',filepath);
        // console.log('relativePath:',relativePath);
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        // Filename "include" filter (whitelist)
        // Note that this also identifies the appropriate key name.
        if (options.filter) {
          var match = file.match(options.filter);
          if (!match) { return; }
          keyName = match[1];
        }

        // If `dontLoad` is true, then don't load anything--
        // instead just set the RHS to `true`.
        if (options.dontLoad) {
          _modules[keyName] = true;
        }
        // Otherwise, dontLoad is falsey (the default), so we'll load
        // this module into memory using `require()`
        else {

          // If `force: true` was set, remove the module from the require()
          // cache, along with any modules that the module `required()`
          if (options.force) {
            var resolved = require.resolve(filepath);
            // First, see if the item is actually cached.
            if (require.cache[resolved]) {
              // If so, add it to a stack of modules to remove.
              var modulesToRemove = [require.cache[resolved]];
              // While there are items in the stack...
              while (modulesToRemove.length) {
                // Pop a module off the stack.
                var moduleToRemove = modulesToRemove.pop();
                // Add its children to the stack.
                var children = (require.cache[moduleToRemove.id] && require.cache[moduleToRemove.id].children) || [];
                // Don't clear compiled node modules from the cache.
                children = _.reject(children, function(child) {
                  return child.id.match(/\.node$/);
                });
                modulesToRemove = modulesToRemove.concat(children);
                // Delete the module from the cache.
                delete require.cache[moduleToRemove.id];
              }
            }
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
    });//</each direct child inode in this directory>


    // Pass these modules back to the previous recursive step.
    return _modules;
  })(contextPath, 0);//</initial call to self-calling, recursive function>
  // ^set up dirname, and start the depth counter at 0


  // Now that all modules have been gathered up, pass map of modules back to userland code.
  return modules;

};
