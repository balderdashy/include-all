module.exports = function isAdmin(req, res, next) {

  // If the user agent DOES NOT have a user id stored in their session...
  if (!req.session.userId) {
    if (req.wantsJSON) {
      return res.forbidden('You are not permitted to perform this action.');
    }
    return res.redirect('/');
  }
  
  // Search for a user based upon the user record id in the session
  User.findOne(req.session.userId).exec(function(err, foundUser){

    // Handle any errors from the findOne query.
    if (err) return res.negotiate(err);

    // If the user id associated with this session does not correspond
    // with a User record in the database...
    if (!foundUser) {
      if (req.wantsJSON) {
        return res.forbidden('You are not permitted to perform this action.');
      }
      return res.redirect('/');
    }

    // If the found user record's admin property is true go to the action
    if (foundUser.admin) {
      return next();

    // Respond with forbidden or redirect based upon the user-agent requirements  
    } else {
      if (req.wantsJSON) {
        return res.forbidden('You are not permitted to perform this action.');
      }
      return res.redirect('/');
    }
  });
};