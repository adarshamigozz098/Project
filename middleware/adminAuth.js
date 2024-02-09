// middleware/adminAuth.js

const isAdminAuthenticated = (req, res, next) => {
   
    if (req.session.adminId && req.session.isAdmin) {
      next();
    } else {
      res.redirect('/admin/');
    }
  }; 



const logoutAdmin = (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying admin session:', err);
    }

    res.redirect('/admin');
  });
};


  module.exports = {
    isAdminAuthenticated,
     logoutAdmin,
  }