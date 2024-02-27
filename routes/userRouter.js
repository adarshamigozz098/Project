const express=require('express')

const userRouter=express()
const userController=require('../controller/userController')
const auth = require('../middleware/auth')


userRouter.set('view engine','ejs')
userRouter.set('views','./views/user')


userRouter.get('/',userController.loadHome)
userRouter.get('/shop',auth.isLogin,userController.loadShop)
userRouter.get('/single',auth.isLogin,userController.loadSingle)
userRouter.get('/about',auth.isLogin,userController.loadAbout)
userRouter.get('/contact',auth.isLogin,userController.loadContact)
userRouter.get('/checkout',auth.isLogin,userController.loadCheckout)

userRouter.post('/orderPlaced', userController.placeOrder);
userRouter.get('/orderConfirmation/:orderId', userController.orderConfirmation);
userRouter.get('/cart',auth.isLogin,userController.loadCart)
userRouter.post('/addToCart',auth.isLogin,userController.addToCart);
userRouter.post('/increaseQuantity', userController.increaseQuantity);
userRouter.delete('/cart/remove', auth.isLogin, userController.removeProduct);


userRouter.get('/otp',userController.loadData)
userRouter.get('/viewDetails',auth.isLogin,userController.viewDetails)

userRouter.get('/productDetails',auth.isLogin,userController.loadSingle)
userRouter.post('/changePassword',userController.changePassword)
userRouter.get('/profile',auth.isLogin,userController.loadProfile)
userRouter.get('/editProfile',userController.editProfile)
userRouter.post('/updateProfile', userController.updateProfile);



userRouter.get("/profile/orders",auth.isLogin,userController.userOrders)
userRouter.get('/profile/address',auth.isLogin,userController.laodUsersAddress)
userRouter.get('/addAddress',auth.isLogin,userController.addAddress)
userRouter.post('/profile/address', userController.saveAddress);
userRouter.get('/profile/editAddress',userController.editAddress)

userRouter.get('/checkAdd',userController.loadCheckAdd)
userRouter.post('/checkAdd',userController.saveAddress)

userRouter.post('/profile/address/delete/:addressId', userController.deleteAddress);

userRouter.get('/changePass',userController.loadForget)
userRouter.post('/cancel-order',userController.cancelOrder);


userRouter.get('/login',auth.isLogout,userController.loadLogin)
userRouter.post('/login',userController.verifyLogin);
userRouter.get('/signup',userController.loadSign)
userRouter.post('/signup',userController.verifySignup)
userRouter.post('/otp',userController.verifyOtp)


userRouter.get('/logout',auth.isLogin,userController.logout);

//forget
userRouter.get('/forget',auth.isLogout,userController.loadForget)
userRouter.post('/forget',userController.forgetPasswordVerify)

userRouter.get('/forgetPassword',userController.resetPasswordLoad)
userRouter.post('/forgetPassword',userController.resetpassword)

userRouter.post("/resendOTP",userController.resendOTP);


module.exports=userRouter



