var fs = require('fs');

// Returns false if the directory doesn't exist
module.exports = function requireAll(options) {
  var files;
  var modules = {};

  // Try to get the starting directory
  try {
    files = fs.readdirSync(options.dirname);
  } catch(e) {
    if(options.optional) return {};
    else throw new Error('Directory not found: ' + options.dirname);
  }

  // Iterate through files in the current directory
  files.forEach(function(file) {
    var filepath = options.dirname + '/' + file;

    // For directories, continue to recursively include modules
    if(fs.statSync(filepath).isDirectory()) {

      // Ignore explicitly excluded directories
      if(excludeDirectory(file)) return;

      // Recursively call requireAll on each child directory
      modules[file] = requireAll({
        dirname: filepath,
        filter: options.filter,
        excludeDirs: options.excludeDirs
      });

    } 
    // For files, go ahead and add the code to the module map
    else {
      var match = file.match(options.filter);
      if(!match) return;

      modules[match[1]] = require(filepath);
    }
  });

  // Pass map of modules back to app code
  return modules;
};

function excludeDirectory(dirname) {
  return options.excludeDirs && dirname.match(options.excludeDirs);
}