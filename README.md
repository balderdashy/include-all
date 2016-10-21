# include-all

An easy way to include all node.js modules within a directory.

> This utility is [called by the moduleloader hook](https://github.com/balderdashy/sails/tree/v0.12.4/lib/hooks/moduleloader) in Sails.js.



## Installation

```
npm install include-all --save
```


## Low-level synchronous usage

By default, `include-all` is synchronous, and a bit low-level.  There are also asynchronous helper methods (which are a bit higher-level), but more on that in a sec.

First, here are some examples of the low-level, synchronous usage:

##### Filter by filename or path


```js
var path = require('path');
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



##### Optional include

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




## High-level asynchronous usage

> The logic from [sails-build-dictionary](https://github.com/sailsjs/sails-build-dictionary) was migrated here.

When you run `require('include-all')`, you get a function.  Calling that function uses include-all with default settings (and any of the options from the table below may be passed in.)

But there are also a handful of convenience methods exposed as properties of that function.  For example:

```javascript
var includeAll = require('include-all');

// Could just call `includeAll()` for synchronous usage.
//
// But could also take advantage of ASYNCHRONOUS usage via:
// • includeAll.optional();
// • includeAll.exists();
// • includeAll.aggregate();
```


#### Available convenience methods

`include-all` exposes 3 different methods for asynchronous usage.

The following convenience methods take all the same options as the default `includeAll` function, but they also support a few _additional_ options.  Also, since they're asynchronous, they work a bit differently:  they use the conventional Node.js "options,cb" function signature.


##### .optional()

Build a dictionary of named modules.
(fails silently-- returns {} -- if the container cannot be loaded)

> This is how most things in the `api/` folder of Sails apps are loaded (e.g. controllers, models, etc.)


```javascript
var path = require('path');
var includeAll = require('include-all');

includeAll.optional({
  dirname: path.resolve('api/controllers'),
  filter: /(.+)Controller\.js$/
}, function (err, modules){
  if (err) {
    console.error('Failed to load controllers.  Details:',err);
    return;
  }

  console.log(modules);

  // =>
  // (notice that `identity` and `globalId` are added automatically)
  //
  // ```
  //  { page:
  //   { showSignupPage: [Function],
  //     showRestorePage: [Function],
  //     showEditProfilePage: [Function],
  //     showProfilePage: [Function],
  //     showAdminPage: [Function],
  //     showHomePage: [Function],
  //     showVideosPage: [Function],
  //     identity: 'page',
  //     globalId: 'Page' },
  //  user:
  //   { login: [Function],
  //     logout: [Function],
  //     signup: [Function],
  //     removeProfile: [Function],
  //     restoreProfile: [Function],
  //     restoreGravatarURL: [Function],
  //     updateProfile: [Function],
  //     changePassword: [Function],
  //     adminUsers: [Function],
  //     updateAdmin: [Function],
  //     updateBanned: [Function],
  //     updateDeleted: [Function],
  //     identity: 'user',
  //     globalId: 'User' },
  //  video: { identity: 'video', globalId: 'Video' } }
  // ```
});
```



##### .exists()

Build a dictionary indicating whether the matched modules exist
(fails silently-- returns {} if the container cannot be loaded)

> This is how Sails detects the existence of views.


##### .aggregate()

Build a single module dictionary by extending {} with the contents of each module.
(fail silently-- returns {} if the container cannot be loaded)

> This is how `sails.config` is built from config files.

For example:

```javascript
require('include-all').aggregate({
  dirname: '/code/brushfire-ch10-end/config/',
  filter: /(.+)\.js$/,
  depth: 1
}, function (err, modules) {
  if (err) { console.error('Error:', err); return; }

  // =>
  //  { blueprints: { actions: false, rest: false, shortcuts: false },
  //    bootstrap: [Function],
  //    connections:
  //     { localDiskDb: { adapter: 'sails-disk' },
  //       someMysqlServer:
  //        { adapter: 'sails-mysql',
  //          host: 'YOUR_MYSQL_SERVER_HOSTNAME_OR_IP_ADDRESS',
  //          user: 'YOUR_MYSQL_USER',
  //          password: 'YOUR_MYSQL_PASSWORD',
  //          database: 'YOUR_MYSQL_DB' },
  //       someMongodbServer: { adapter: 'sails-mongo', host: 'localhost', port: 27017 },
  //       somePostgresqlServer:
  //        { adapter: 'sails-postgresql',
  //          host: 'YOUR_POSTGRES_SERVER_HOSTNAME_OR_IP_ADDRESS',
  //          user: 'YOUR_POSTGRES_USER',
  //          password: 'YOUR_POSTGRES_PASSWORD',
  //          database: 'YOUR_POSTGRES_DB' },
  //       myPostgresqlServer:
  //        { adapter: 'sails-postgresql',
  //          host: 'localhost',
  //          user: 'jgalt',
  //          password: 'blahblah',
  //          database: 'brushfire' } },
  //    cors: {},
  //    globals: {},
  //    http: {},
  //    i18n: {},
  //    log: {},
  //    models: { connection: 'localDiskDb', schema: true, migrate: 'drop' },
  //    policies:
  //     { '*': true,
  //       VideoController: { create: [Object] },
  //       UserController:
  //        { login: [Object],
  //          logout: [Object],
  //          removeProfile: [Object],
  //          updateProfile: [Object],
  //          restoreGravatarURL: [Object],
  //          changePassword: [Object],
  //          signup: [Object],
  //          restoreProfile: [Object],
  //          adminUsers: [Object],
  //          updateAdmin: [Object],
  //          updateBanned: [Object],
  //          updateDeleted: [Object] },
  //       PageController:
  //        { showSignupPage: [Object],
  //          showAdminPage: [Object],
  //          showProfilePage: [Object],
  //          showEditProfilePage: [Object],
  //          showRestorePage: [Object] } },
  //    routes:
  //     { 'PUT /login': 'UserController.login',
  //       'GET /logout': 'UserController.logout',
  //       'GET /video': 'VideoController.find',
  //       'POST /video': 'VideoController.create',
  //       'POST /user/signup': 'UserController.signup',
  //       'PUT /user/removeProfile': 'UserController.removeProfile',
  //       'PUT /user/restoreProfile': 'UserController.restoreProfile',
  //       'PUT /user/restoreGravatarURL': 'UserController.restoreGravatarURL',
  //       'PUT /user/updateProfile': 'UserController.updateProfile',
  //       'PUT /user/changePassword': 'UserController.changePassword',
  //       'GET /user/adminUsers': 'UserController.adminUsers',
  //       'PUT /user/updateAdmin/:id': 'UserController.updateAdmin',
  //       'PUT /user/updateBanned/:id': 'UserController.updateBanned',
  //       'PUT /user/updateDeleted/:id': 'UserController.updateDeleted',
  //       'GET /': 'PageController.showHomePage',
  //       'GET /videos': 'PageController.showVideosPage',
  //       'GET /administration': 'PageController.showAdminPage',
  //       'GET /profile': 'PageController.showProfilePage',
  //       'GET /edit-profile': 'PageController.showEditProfilePage',
  //       'GET /restore': 'PageController.showRestorePage',
  //       'GET /signup': 'PageController.showSignupPage' },
  //    session: { secret: 'blahblah' },
  //    sockets: {},
  //    views: { engine: 'ejs', layout: 'layout', partials: true } }
});
```



## Options

| Option      | Description
|:------------|:------------------------------------------------------------------------|
| dirname     | The absolute path of a directory to load modules from.
| force       | When set, any past require cache entry will be cleared before re-requiring a module.
| optional    | if enabled, continue silently and return {} when source directory does not exist or cannot be read.  Normally, this throws an error in that scenario.  default: false
| ignoreRequireFailures    | if enabled, continue silently if a `require()` call throws.  _This should be used with care!  It completely swallows the require error!_  default: false.  This is useful for tolerating malformed node_modules (see https://github.com/balderdashy/include-all/pull/14)
| excludeDirs | A regular expression used to EXCLUDE directories by name.
| depth       | the maximum level of recursion where modules will be included. Defaults to infinity.
| filter      | only include modules whose FILENAME matches this regex. default `undefined`
| pathFilter  | only include modules whose FULL RELATIVE PATH matches this regex (relative from the entry point directory). default `undefined`
| dontLoad    | if `dontLoad` is set to true, don't run the module w/ V8 or load it into memory-- instead, return a tree representing the directory structure (all extant file leaves are included as keys, with their value = `true`)
| flatten     | if enabled, ALL modules appear as top-level keys in the dictionary-- even those from within nested directories.
| keepDirectoryPath | Only relevant if `flatten` is `true`.  If enabled, this option causes include-all to include the relative paths in the key names (for nested modules from subdirectories path in the key names).


## High-Level Options

_The following options are only usable in the higher-level asynchronous methods like `optional()`:_

| Option      | Description
|:------------|:------------------------------------------------------------------------|
| identity    | if disabled, (explicitly set to false) don't inject an identity into the module also don't try to use the bundled `identity` property in the module to determine the keyname in the result dictionary. default: true
| useGlobalIdForKeyName |  if `useGlobalIdForKeyName` is set to true, don't lowercase the identity to get the keyname-- just use the globalId.
| replaceExpr | in identity: use this regex to remove substrings like 'Controller' or 'Service' and replace them with the value of `replaceVal`
| replaceVal  | see above. default value: '' |
| aggregate   | if enabled, include-all will build the result dictionary by merging all of the target modules together.  Note: Each module must export a dictionary in order for this to work (e.g. for building a configuration dictionary from a set of config files).



## History

Back in 2012, this was originally forked from felixge's awesome module, `require-all` (https://github.com/felixge/node-require-all).

It adds a few extra capabilities on top:
- the ability to `include-all` a directory as **optional**.
- the ability to recursively stat a directory, instead of actually requiring the modules (via the `dontLoad` option)
- the ability to filter by path, not just filename (pathFilter)

Since then, it has evolved quite a bit, but the base implementation is still the same.


## Help

First, please read through the documentation above.  If you have further questions or are having trouble, click [here](http://sailsjs.com/support).


## Bugs &nbsp; [![NPM version](https://badge.fury.io/js/include-all.svg)](http://npmjs.com/package/include-all)

To report a bug, [click here](http://sailsjs.com/bugs).


## Contributing

Please observe the guidelines and conventions laid out in the [Sails project contribution guide](http://sailsjs.com/contribute) when opening issues or submitting pull requests.

[![NPM](https://nodei.co/npm/include-all.png?downloads=true)](http://npmjs.com/package/include-all)


## License

MIT

Copyright &copy; 2011 [Felix Geisendörfer](http://github.com/felixge)
Copyright &copy; 2012 [Mike McNeil](http://github.com/mikermcneil)

_A core module in the Sails framework since 2012._

The [Sails framework](http://sailsjs.com) is free and open-source under the [MIT License](http://sailsjs.com/license).

