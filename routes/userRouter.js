const express = require("express");

const userRouter = express();
const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const couponController = require("../controller/couponController");
const auth = require("../middleware/auth");
const profileController = require("../controller/profileController");

userRouter.set("view engine", "ejs");
userRouter.set("views", "./views/user");


//USER
userRouter.get("/", userController.loadHome);
userRouter.get("/shop", auth.isLogin, userController.loadShop);
userRouter.post("/shop", auth.isLogin, userController.loadShop);
userRouter.get("/single", auth.isLogin, userController.loadSingle);
userRouter.get("/productDetails", auth.isLogin, userController.loadSingle);
userRouter.get("/about", auth.isLogin, userController.loadAbout);
userRouter.get("/contact", auth.isLogin, userController.loadContact);
userRouter.get("/checkout", auth.isLogin, userController.loadCheckout);
userRouter.post("/orderPlaced", auth.isLogin,userController.placeOrder);
userRouter.get("/orderConfirmation/:orderId", userController.orderConfirmation);
userRouter.get("/otp", userController.loadData);
userRouter.get("/checkAdd", userController.loadCheckAdd);
userRouter.get("/changePass", userController.loadForget);
userRouter.get("/login", auth.isLogout, userController.loadLogin);
userRouter.post("/login", userController.verifyLogin);
userRouter.get("/signup", userController.loadSign);
userRouter.post("/signup", userController.verifySignup);
userRouter.post("/otp", userController.verifyOtp);
userRouter.get("/logout", auth.isLogin, userController.logout);
userRouter.post("/applyCoupon", auth.isLogin,couponController.applyCoupon);

//forget
userRouter.get("/forget", auth.isLogout, userController.loadForget);
userRouter.post("/forget", userController.forgetPasswordVerify);
userRouter.get("/forgetPassword", userController.resetPasswordLoad);
userRouter.post("/forgetPassword", userController.resetpassword);
userRouter.post("/resendOTP", userController.resendOTP);

// USER PROFILE
userRouter.get("/profile", auth.isLogin, profileController.loadProfile);
userRouter.get("/editProfile", profileController.editProfile);
userRouter.post("/changePassword", auth.isLogin,profileController.changePassword);
userRouter.post("/updateProfile", auth.isLogin,profileController.updateProfile);
// ORDERS
userRouter.get("/profile/orders", auth.isLogin, profileController.userOrders);
userRouter.get("/viewDetails", auth.isLogin, profileController.viewDetails);
userRouter.post("/cancel-order", auth.isLogin,profileController.cancelOrder);
userRouter.post("/returnOrder", auth.isLogin,profileController.returnOrder);
//ADDRESS
userRouter.get("/profile/address",auth.isLogin, profileController.laodUsersAddress);
userRouter.get("/addAddress", auth.isLogin, profileController.addAddress);
userRouter.post("/profile/address", auth.isLogin, profileController.saveAddress);
userRouter.post( "/profile/address/delete/:addressId", auth.isLogin,profileController.deleteAddress);
userRouter.get("/profile/editAddress", profileController.editAddress);
userRouter.post("/profile/editAddress", profileController.saveEditedAddress);
// wallet
userRouter.get("/profile/wallet", auth.isLogin, profileController.wallet);
userRouter.get("/invoice", auth.isLogin, profileController.invoiceDownload);

//cart
userRouter.get("/cart", auth.isLogin, cartController.loadCart);
userRouter.post("/addToCart", auth.isLogin, cartController.addToCart);
userRouter.post("/increaseQuantity", auth.isLogin,cartController.increaseQuantity);
userRouter.delete("/cart/remove", auth.isLogin,auth.isLogin, cartController.removeProduct);



module.exports = userRouter;
