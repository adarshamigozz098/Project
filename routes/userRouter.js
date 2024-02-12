const express=require('express')

const userRouter=express()
const userController=require('../controller/userController')
const auth = require('../middleware/auth')


userRouter.set('view engine','ejs')
userRouter.set('views','./views/user')


userRouter.get('/',userController.loadHome)
userRouter.get('/shop',userController.loadShop)
userRouter.get('/single',userController.loadSingle)
userRouter.get('/about',userController.loadAbout)
userRouter.get('/contact',auth.isLogin,userController.loadContact)
userRouter.get('/checkout',auth.isLogin,userController.loadCheckout)

userRouter.post('/orderPlaced', userController.placeOrder);
userRouter.get('/orderConfirmation/:orderId', userController.orderConfirmation);
userRouter.get('/cart',auth.isLogin,userController.loadCart)
userRouter.post('/addToCart',auth.isLogin,userController.addToCart);
userRouter.delete('/cart/remove', auth.isLogin, userController.removeProduct);

userRouter.get('/otp',userController.loadData)
userRouter.get('/viewDetails',userController.viewDetails)

userRouter.get('/productDetails',userController.loadSingle)
userRouter.get('/profile',userController.loadProfile)
userRouter.get('/editProfile',userController.editProfile)
userRouter.post('/updateProfile', userController.updateProfile);


userRouter.get("/profile/orders",userController.userOrders)
userRouter.get('/profile/address',userController.laodUsersAddress)
userRouter.get('/addAddress',userController.addAddress)
userRouter.post('/profile/address', userController.saveAddress);
userRouter.get('/profile/editAddress',userController.editAddress)
userRouter.post("/cancel-order", userController.OrderCancel);
userRouter.post('/EditAddress',userController.editADD)

userRouter.post('/profile/address/delete/:addressId', userController.deleteAddress);

userRouter.get('/changePass',userController.loadForget)
userRouter.post('/cancelOrder',userController.cancelOrder);





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



