module.exports = function (req, res, next) {
  console.log('Admin middleware check:', { 
    hasUser: !!req.user, 
    userRole: req.user?.role,
    isAdmin: req.user?.role === 'admin'
  }); // Debug log

  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Admin access required' });
  }
};
