const coupon = require("../model/coupon")


const loadCoupon = async (req, res) => {
    try {
      const coupons = await coupon.find({});
      res.render("coupon", { coupons }); 
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }
  
  
  const LoadaddCoupon = async(req,res)=>{
    try {
      res.render("addCoupon")
    } catch (error) {
      console.log(error);
    }
  }
  
  const couponAddPost = async (req, res, next) => {
    try {
      const code = req.body.code;
      const couponCode = await coupon.findOne({ code: code });
  
      if (couponCode) {
        res.render("addCoupon", { message: "This Coupon Already Exists" });
      } else {
        const newCoupon = new coupon({
          code: req.body.code,
          discountType: req.body.discountType,
          discountAmount: req.body.amount,
          maxCartAmount: req.body.cartAmount,
          maxDiscountAmount: req.body.discountAmount,
          maxUsers: req.body.couponCount,
          expiryDate: req.body.date,
        });
        const savedCoupon = await newCoupon.save();
        console.log("Saved Coupon:", savedCoupon);
        const coupons = await coupon.find({});
        res.render("coupon", { coupons });
        console.log(coupons,"got :");
      }
    } catch (error) {
      console.log(error.message);
      next(error);
    }
  };
  
  
  const loadEditCoupon = async (req, res,next) => {
    try {
      const id = req.query.id;
      const couponData = await coupon.findOne({ _id: id });
      res.render("editCoupon", { couponData });
    } catch (error) {
      console.log(error.message);
      next(error)
    }
  };
  
  const updateCoupon = async (req, res,next) => {
    try {
      const couponId = req.query.id;
      const coupons = await coupon.findByIdAndUpdate(
        { _id: couponId },
        {
          code: req.body.code,
          discountType: req.body.discountType,
          discountAmount: req.body.amount,
          expiryDate: req.body.date,
          maxCartAmount: req.body.cartAmount,
          maxDiscountAmount: req.body.discountAmount,
          maxUsers: req.body.couponCount,
        }
      );
      await coupons.save();
      res.redirect("/admin/coupon");
    } catch (error) {
      console.log(error.message);
      next(error)
    }
  };
  
  
  const deleteCoupon = async (req, res) => {
    try {
      const couponId = req.query.id; 
      console.log(couponId, "id kittiyooo"); 
      const Coupon = await coupon.findById(couponId); 
      console.log(coupon, "enthelum indoo");
      
      if (!Coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      await coupon.findByIdAndDelete(couponId); 
      res.redirect("/admin/coupon")
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



//apply coupon
const applyCoupon = async (req, res,next) => {
    try {
      const code = req.body.code;
      console.log("code:",code);
      const amount = Number(req.body.amount);
      console.log(amount,"numm");
      const userExist = await coupon.findOne({
        code: code,
        user: { $in: [req.session.userId] },
      });
      if (userExist) {
        res.json({ user: true });
      } else {
        const couponData = await coupon.findOne({ code: code });
        
        if (couponData) {
          if (couponData.maxUsers <= 0) {
            res.json({ limit: true });
          } else {
            if (couponData.status == false) {
              res.json({ status: true });
            } else {
              if (couponData.expiryDate <= new Date()) {
                res.json({ date: true });
              } else {
                if (couponData.maxCartAmount >= amount) {
                  res.json({ cartAmount: true });
                } else {
                  await coupon.findByIdAndUpdate(
                    { _id: couponData._id },
                    { $push: { user: req.session.user_id } }
                  );
                  await coupon.findByIdAndUpdate(
                    { _id: couponData._id },
                    { $inc: { maxUsers: -1 } }
                  );
                  if (couponData.discountType == "Fixed Amount") {
                    const disAmount = couponData.discountAmount;
                    const disTotal = Math.round(amount - disAmount);
                    req.session.coupon = disTotal
                    console.log(disTotal+"DFGHJKL");
                    return res.json({ amountOkey: true, disAmount, disTotal });
                  } else if (couponData.discountType == "Percentage Type") {
                    const perAmount = (amount * couponData.discountAmount) / 100;
                    if (perAmount <= couponData.maxDiscountAmount) {
                      const disAmount = perAmount;
                      const disTotal = Math.round(amount - disAmount);
                      req.session.coupon = disTotal
                      console.log(disTotal+"QWERTYU");
                      return res.json({ amountOkey: true, disAmount, disTotal });
                    }
                  } else {
                    const disAmount = couponData.maxDiscountAmount;
                    const disTotal = Math.round(amount - disAmount);
                    req.session.coupon = disTotal
                    console.log(disTotal+"ZXCVBNM");
                    return res.json({ amountOkey: true, disAmount, disTotal });
                  }
                }
              }
            }
          }
        } else {
          res.json({ invalid: true });
        }
      }
    } catch (error) {
      console.log(error.message);
      console.error("Error occurred while loading apply coupon page:", error);
      next(error)
      }
  };
  



module.exports={
    
    applyCoupon,
    loadCoupon,
    LoadaddCoupon,
    couponAddPost,
    deleteCoupon,
    loadEditCoupon, 
    updateCoupon,
}