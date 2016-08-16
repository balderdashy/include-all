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
 *
 * @optional {RegExp} filter
 *
 * @optional {RegExp} excludeDirs
 *
 * @optional {Number} depth
 *
 * @optional {Boolean} optional
 *           @default false
 *
 * @optional {Boolean} dontLoad
 *           @default false
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @return {Dictionary}
 *         A dictionary containing all the modules that were loaded.
 *         Keys are filenames and values are module refs.
 */
module.exports = function includeAll(options) {
  var modules = {};

  if (typeof(options.force) === 'undefined') {
    options.force = true;
  }

  // Sane default for `filter` option
  if (!options.filter) {
    options.filter = /(.*)/;
  }

  // Reset our depth counter the first time
  if (typeof options._depth === 'undefined') {
    options._depth = 0;
  }

  // Bail out if our counter has reached the desired depth
  // indicated by the user in options.depth
  if (typeof options.depth !== 'undefined' &&
    options._depth >= options.depth) {
    return;
  }

  // Remember the starting directory
  if (!options.startDirname) {
    options.startDirname = options.dirname;
  }

  // List files in the specified directory.
  var files;
  try {
    files = fs.readdirSync(options.dirname);
  } catch (e) {
    if (options.optional) { return {}; }
    else {
      var dirNotFoundErr = new Error('Directory not found: ' + options.dirname + '\nDetails:' + e.stack);
      dirNotFoundErr.code = 'include-all:DIRECTORY_NOT_FOUND';
      throw dirNotFoundErr;
    }
  }

  // Iterate through files in the current directory
  files.forEach(function (file) {
    var filepath = path.join(options.dirname, file);

    // For directories, continue to recursively include modules
    if (fs.statSync(filepath).isDirectory()) {

      // Ignore explicitly excluded directories
      if (options.excludeDirs && file.match(options.excludeDirs)) { return; }

      // Recursively call includeAll on each child directory
      modules[file] = includeAll({
        dirname: filepath,
        filter: options.filter,
        pathFilter: options.pathFilter,
        excludeDirs: options.excludeDirs,
        startDirname: options.startDirname,
        dontLoad: options.dontLoad,
        markDirectories: options.markDirectories,
        flattenDirectories: options.flattenDirectories,
        keepDirectoryPath: options.keepDirectoryPath,
        force: options.force,

        // Keep track of depth
        _depth: options._depth+1,
        depth: options.depth
      });

      if (options.markDirectories || options.flattenDirectories) {
        modules[file].isDirectory = true;
      }

      if (options.flattenDirectories) {

        modules = (function _recursivelyFlattenDirectories(modules, accum, thisPath) {
          accum = accum || {};
          Object.keys(modules).forEach(function (keyName) {
            if (typeof(modules[keyName]) !== 'object' && typeof(modules[keyName]) !== 'function') {
              return;
            }
            if (modules[keyName].isDirectory) {
              _recursivelyFlattenDirectories(modules[keyName], accum, thisPath ? path.join(thisPath, keyName) : keyName );
            } else {
              accum[options.keepDirectoryPath ? (thisPath ? path.join(thisPath, keyName) : keyName) : keyName] = modules[keyName];
            }
          });
          return accum;
        })(modules);

      }//</if options.flattenDirectories>

    }//</if (this is a directory)>

    // Otherwise, this is a file.
    // So we'll go ahead and add a key for it in our module map.
    else {

      // Key name for module
      var keyName;

      // Filename filter
      if (options.filter) {
        var match = file.match(options.filter);
        if (!match) { return; }
        keyName = match[1];
      }

      // Full relative path filter
      if (options.pathFilter) {
        // Peel off relative path
        var relPath = filepath.replace(options.startDirname, '');

        // Make sure exactly one slash exists on the left side of path.
        relPath = relPath.replace(/^\/*/, '/');

        var pathMatch = relPath.match(options.pathFilter);
        if (!pathMatch) { return; }
        keyName = pathMatch[2];
      }

      // Load module into memory (unless `dontLoad` is true)
      if (options.dontLoad) {
        modules[keyName] = true;
      }
      else {
        if (options.force) {
          var resolved = require.resolve(filepath);
          if (require.cache[resolved]) { delete require.cache[resolved]; }
        }
        modules[keyName] = require(filepath);
      }

    }//</else (this is a file)>
  });//</each file>

  // Pass map of modules back to userland code.
  return modules;

};
