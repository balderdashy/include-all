var fs = require('fs');
var ltrim = require('underscore.string').ltrim;


module.exports = function requireAll(options) {
  if ( typeof options === "string" ) {
    options = { dirname: options };
  }

  var context = extend( {
    // defaults:
    force: true,
    startDirname: options.dirname
  }, options, {
    // assure depth to be non-negative integer
    depth: Math.max( 0, parseInt( options.depth ) || 0 ) || 9999
  } );

  // normalize any filter provided in options to be unconditionally callable
  var exclFn = isFn(context.excludeDirs) ? context.excludeDirs : context.excludeDirs ? excludeDirectory: falsey;
  var fileFn = context.filter && (isFn(context.filter) ? context.filter : filterFn);
  var pathFn = context.pathFilter && (isFn(context.pathFilter) ? context.pathFilter : pathFilterFn);
  var nameFn = (context.keepDirectoryPath && context.flattenDirectories) ? qualifyIdentity : passIdentity;

  return collectLevel( extend( context, {
    excludeDirFn: exclFn,
    fileFilterFn: fileFn,
    pathFilterFn: pathFn,
    identityFn: nameFn,
    filterFn: ( fileFn && pathFn ) ? bothFilterFn : ( fileFn || pathFn || truthy )
  } ), {}, options.dirname, 0, options.flattenDirectories );
};


function truthy() { return true; }
function falsey() { return false; }

function excludeDirectory(context, fileName, pathName, depth) {
  return fileName.match(context.excludeDirs);
}

/** Processes regular expression provided in options.filter. */
function filterFn(context, fileName, pathName, depth) {
  var match = fileName.match(context.filter);
  return match ? match[1] : undefined;
}

/** Processes regular expression provided in options.pathFilter. */
function pathFilterFn(context, fileName, pathName, depth) {
  var match = ('/' + ltrim(pathName.replace(context.startDirname, ''), '/')).match(context.pathFilter);
  return match ? match[2] : undefined;
}

/** Processes both filters provided in options.filter and options.pathFilter. */
function bothFilterFn(context, fileName, pathName, depth) {
  return context.fileFilterFn(context, fileName, pathName, depth) &&
         context.pathFilterFn(context, fileName, pathName, depth);
}

function qualifyIdentity(pathName, identity) {
  return pathName + '/' + identity;
}

function passIdentity(pathName, identity) {
  return identity;
}

/** Processes all matches in a given folder. */
function collectLevel( context, modules, pathName, currentDepth, flattening ) {
  if (currentDepth >= context.depth) {
    return modules;
  }

  try {
    var files = fs.readdirSync(pathName);
  } catch (e) {
    if (context.optional) return modules;

    throw new Error('Directory not found: ' + pathName);
  }

  files.forEach(function(file) {
    var filePath = pathName + '/' + file;

    if (fs.statSync(filePath).isDirectory()) {
      if (context.excludeDirFn(context, file, pathName, currentDepth)) return;

      var sub = collectLevel(context, flattening ? modules : {}, filePath, currentDepth + 1, flattening);
      if (!flattening && !isEmpty(sub)) {
        if (context.markDirectories) {
          sub.isDirectory = true;
        }

        modules[file] = sub;
      }
    } else {
      var module, identity = context.filterFn(context, file, pathName, currentDepth);
      if (identity) {
        if (context.dontLoad) {
          module = true;
        } else {
          if (context.force) {
            var resolved = require.resolve(filePath);
            if (require.cache[resolved]) delete require.cache[resolved];
          }
          module = require(filePath);
        }

        if (!flattening || (module && (typeof module === 'object' || typeof module === 'function' ))) {
          modules[context.identityFn(pathName, identity)] = module;
        }
      }
    }
  });

  return modules;
}

function extend( target ) {
  for ( var arg, i = 1, l = arguments.length; i < l; i++ ) {
    arg = arguments[i] || {};
    Object.keys( arg )
        .forEach( function( name ) { target[name] = arg[name]; } );
  }

  return target;
}

function isEmpty( value ) {
  return !value || ( typeof value == "object" && !Object.keys( value ).length );
}

function isFn( value ) {
  return typeof value === "function";
}
