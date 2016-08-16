# include-all

An easy way to include all node.js modules within a directory.

This is a fork of felixge's awesome module, require-all (https://github.com/felixge/node-require-all) which adds a few extra capabilities:
- the ability to `include-all` a directory as **optional**.
- the ability to recursively stat a directory, instead of actually requiring the modules (via the `dontLoad` option)
- the ability to filter by path, not just filename (pathFilter)



## Usage

#### Filter by filename or path


```js
var path = require('include-all');
var includeAll = require('include-all');

var controllers = require('include-all')({
  dirname     :  path.join(__dirname, 'controllers'),
  filter      :  /(.+Controller)\.js$/,
  excludeDirs :  /^\.(git|svn)$/
});

```


`controllers` is now a dictionary with references to all modules matching the filter.
The keys are the filenames (minus the extension).

For example:

```javascript
{
  PageController: {
    showHomepage: function (req, res) { /*...*/ },
    /*...*/
  },
  /*...*/
}
```

> Keep in mind that the case-sensitivity of file and directory names varies between operating systems (Linux/Windows/Mac).



#### Optional include

Normally, if an error is encountered when requiring/reading/listing files or directories, it is thrown.  To swallow that error silently, set `optional: true`:

```javascript
var models = require('include-all')({
  dirname     :  path.join(__dirname, 'models'),
  filter      :  /(.+)\.js$/,
  excludeDirs :  /^\.(git|svn)$/,
  optional    :  true
});

```

`models` is now a dictionary with references to all modules matching the filter.
If `__dirname + '/models'` doesn't exist, instead of throwing an error, `{}` is returned.

For example:

```
{
  User: {
    attributes: {},
    datastore: 'localDiskDb',
    /*...*/
  },
  /*...*/
}
```



