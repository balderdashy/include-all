module.exports = function(req, res, next) {

  // User is allowed to proceed to the next policy, 
  // or if this is the last policy, the controller
  if (!req.session.userId) {
    return next();
  }

  if (req.wantsJSON) {

    // User is not allowed
    return res.forbidden('You are not permitted to perform this action.');
  }

  return res.redirect('/');
};
