const User = require('../model/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.userId) {
            // Assuming you have a User model
            const user = await User.findById(req.session.userId);

            if (user) {
                req.user = user; // Set the user information in the request object
                return next();
            }
        }

        // Store the original URL to redirect after login
        req.session.returnTo = req.originalUrl;

        res.redirect('/login');
    } catch (error) {
        console.error('Error in isLogin middleware:', error);
        res.redirect('/login');
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.userId) {
            // Destroy the session upon logout
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }

                res.redirect('/');
            });
        } else {
            next();
        }
    } catch (error) {
        console.error('Error in isLogout middleware:', error);
        res.redirect('/');
    }
};

const checkBlocked = async (req, res, next) => {
    const userId = req.session.userId;

    if (userId) {
        try {
            const user = await User.findById(userId);

            if (user && user.isBlocked) {
                // Clear userId and redirect to login if the user is blocked
                req.session.userId = null;
                return res.redirect('/login');
            }
        } catch (error) {
            console.error('Error in checkBlocked middleware:', error);
        }
    }

    next();
};

module.exports = {
    isLogin,
    isLogout,
    checkBlocked,
};
