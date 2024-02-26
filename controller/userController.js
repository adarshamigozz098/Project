const User = require("../model/userModel");
const product = require("../model/product");
const Cart = require("../model/cart");

const config = require("../config/config");
const razorpay = require("razorpay");

const sharp = require("sharp");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userOTPverification = require("../model/userOTPverification");
const randomstrings = require("randomstring");
const order = require("../model/order");
const { connections } = require("mongoose");

var instance = new razorpay({
  key_id: "rzp_test_eUnQ885ah336VG",
  key_secret: "2iLbGXeXJmvQGPb4dMOPlrST",
});

const verifySignup = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;
    const emailExist = await User.findOne({ email: email });

    if (emailExist) {
      req.flash("message", "Existing User");
      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = new User({
      username,
      phone,
      email,
      password: hashedPassword,
      isAdmin: 0,
      verified: false,
    });

    await newuser.save();
    await sendMail(newuser, res);
    console.log("success");
  } catch (error) {
    console.log(error);
    req.flash("message", "An error occurred. Please try again.");
    return res.redirect("/signup");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      req.flash("error", "User not Found");
      return res.redirect("/login");
    }

    if (userData.isBlocked) {
      req.flash("error", "User is blocked");
      return res.redirect("/login");
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      req.flash("message", "Password does not match");
      console.log("password does not match");
      return res.redirect("/login");
    }

    req.session.userId = userData._id;
    console.log(req.session.userId);
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Internal Server Error");
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// const securePassword = async (password) => {
//   try {
//     const passwordHash = await bcrypt.hash(password, 10);
//     return passwordHash;
//   } catch (error) {
//     console.log(error);
//   }
// };

const sendMail = async ({ email }, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: "pa772250@gmail.com",
        pass: "ozsq enxc hswi rvzt",
      },
    });
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOption = {
      from: "pa772250@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
          <div style="margin: 50px auto; width: 70%; padding: 20px 0; background-color: #c7ecc7; border-radius: 8px;">
            <div style="border-bottom: 1px solid #eee;">
            <a href="hidden" style="font-size: 1.4em; color: #4caf50; text-decoration: none; font-weight: 600;">MINI SHOP</a>
          </div>
            <p style="font-size: 1.1em;">Hi,</p>
            <p>Thank you for choosing MINI SHOP. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
            <h2 style="background: #4caf50; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
            <p style="font-size: 0.9em;">Regards,<br />MINI SHOP</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
              <p>MINI SHOP Inc</p>
              <p>MALAPPURAM 670692</p>
              <p>India</p>
            </div>
          </div>
        </div>`,
    };

    const hashedOTP = await bcrypt.hash(otp, 10);
    const newOTPverification = await new userOTPverification({
      email: email,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    });

    await newOTPverification.save();
    await transporter.sendMail(mailOption);
    console.log(`OTP send for ${email} will be deleted in 1 minutes`);
    setTimeout(async () => {
      await userOTPverification.deleteOne({ email: email });
      console.log(`OTP for ${email} has been deleted after 1 minutes.`);
    }, 60000);

    res.redirect(`/otp?email=${email}`);
  } catch (error) {
    console.log(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userOTPverification.findOne({ email: email });

    const hashedOtp = user.otp;

    const otpVerified = await bcrypt.compare(otp, hashedOtp);
    if (otpVerified === true) {
      await User.findOneAndUpdate({ email: email }, { verified: true });
      await userOTPverification.deleteOne({ email: email });

      res.redirect("/login");
    } else {
      res.render("otp", { message: "otp is incorrect", email });
    }
  } catch (error) {}
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Resending OTP for email:", email);
    const user = await userOTPverification.findOne({ email: email });

    const oneMinuteAgo = Date.now() - 60 * 1000;
    if (user && user.expiresAt > oneMinuteAgo) {
      console.log(
        "Previous OTP was sent less than one minute ago for email:",
        email
      );
      res.status(400).send("Previous OTP was sent less than one minute ago");
      return;
    }

    if (!user || user.expiresAt < Date.now()) {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedOTP = await bcrypt.hash(otp, 10);

      await userOTPverification.findOneAndUpdate(
        { email: email },
        {
          otp: hashedOTP,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
        },
        { upsert: true }
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        auth: {
          user: "pa772250@gmail.com",
          pass: "ozsq enxc hswi rvzt",
        },
      });

      const mailOption = {
        from: "pa772250@gmail.com",
        to: email,
        subject: "Verify Your Email",
        html: `<div>Your new OTP is: ${otp}</div>`,
      };

      await transporter.sendMail(mailOption);
      console.log("New OTP sent successfully to:", email);
      res.send("New OTP sent successfully");
    } else {
      console.log("Previous OTP is still valid for email:", email);
      res.status(400).send("Previous OTP is still valid");
    }
  } catch (error) {
    console.error("Error resending OTP for email:", email, error);
    res.status(500).send("Internal server error");
  }
};
// reset
const loadForget = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};

const forgetPasswordVerify = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("email", email);
    const details = await User.findOne({ email: email });
    console.log(22, details);
    if (details) {
      if (details.verified == 0) {
        res.render("forgetPassword", { message: "Please Verify your email" });
      } else {
        const randomstring = randomstrings.generate();
        const updatedetail = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } }
        );
        console.log(updatedetail, 33);
        sendforgetemail(details.name, details.email, randomstring);
        res.render("forgetPassword", { message: "Please check your email" });
      }
    } else {
      res.render("forgetPassword", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const sendforgetemail = async (name, email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "pa772250@gmail.com",
        pass: "ozsq enxc hswi rvzt",
      },
    });

    const mailOptions = {
      from: "pa772250@gmail.com",
      to: email,
      subject: "For Reset Password",
      html:
        "<p>Hii " +
        name +
        ', please click here to <a href="http://127.0.0.1:6003/forgetpassword?token=' +
        token +
        '">Reset</a> your password.</p>',
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
};

const resetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const TOkenId = await User.findOne({ token: token });
    if (TOkenId) {
      res.render("resetpassword", { message: "", TOkenId: TOkenId });
      console.log("too", TOkenId);
    } else {
      res.redirect("/forget");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetpassword = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const Token = req.body.token;

    if (password === confirmPassword && Token) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatepass = await User.findOneAndUpdate(
        { _id: Token },
        { $set: { password: hashedPassword } }
      );
      if (updatepass) {
        req.flash("success", "Password changed successfully");
        res.redirect("/login");
        console.log("Password changed successfully");
        return;
      }
    }
    // If password update fails
    req.flash("error", "Password update failed");
    res.redirect("/forget");
  } catch (error) {
    console.log(error.message);
    req.flash("error", "An error occurred");
    res.redirect("/forget");
  }
};

const loadSign = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res) => {
  try {
    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
    }

    res.render("home", { currentUser });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadShop = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let query = {};

    if (req.query.search) {
      query = { name: { $regex: new RegExp(req.query.search, "i") } };
    }
    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
    }
    let sortOption = {};

    if (req.query.sort === "lowToHigh") {
      sortOption = { price: 1 };
    } else if (req.query.sort === "highToLow") {
      sortOption = { price: -1 };
    }

    const totalProducts = await product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const productData = await product
      .find(query)
      .sort(sortOption)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .exec();

    res.render("shop", {
      product: productData,
      currentPage: page,
      totalPages: totalPages,
      sort: req.query.sort,
      currentUser,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadContact = async (req, res) => {
  try {
    let currentUser;
    if (req.session.userId) {
      currentUser = await User.findById(req.session.userId);
      res.render("contact", { currentUser: req.session.user_id });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById(userId);

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    res.render("profile", {
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      currentUser: req.session.user_id,
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/login");
  }
};

// const editProfile = async (req, res) => {
//   try {
//     const userId = req.session.userId;
// const { username, email, phone } = req.body;

// const updatedUser = await User.findByIdAndUpdate(
//   userId,
//   { username, email, phone },
//   { new: true }
// );
// Send JSON response for AJAX requests
// if (req.xhr) {
//   return res.status(200).json({ success: true, user: updatedUser });

//     res.redirect("/profile");
//   } catch (error) {
//     console.error(error);

//     // Send JSON response for AJAX requests
//     if (req.xhr) {
//       return res
//         .status(500)
//         .json({ success: false, error: "Internal Server Error" });
//     }

//     res.status(500).send("Internal Server Error");
//   }
// };

const editProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById(userId);
    

    if (!userData) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
  

    res.render("editProfile", { userData });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/login");
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, phone } = req.body;

    await User.findByIdAndUpdate(userId, { username, email, phone });

    req.flash("success", "Profile updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    res.redirect("/editProfile");
  }
};

const userOrders = async (req, res) => {
  try {
    const userData = req.session.userId;
    if (userData) {
      const Orders = await order
        .find({ user_id: userData })
        .populate("user_id");
      // console.log("jbshjdd", Orders);

      res.render("userOrders", { Orders, currentUser: req.session.user_id });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const laodUsersAddress = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });

    res.render("address", { Data: userData, currentUser: req.session.user_id });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const saveAddress = async (req, res) => {
  try {
    const { name, housename, city, state, phone, pincode } = req.body;
    const newAddress = {
      name,
      housename,
      city,
      state,
      phone,
      pincode,
    };

    await User.findByIdAndUpdate(
      req.session.userId,
      { $push: { address: newAddress } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    // console.log("jsd", addressId);
    const userData = await User.findOne({ _id: req.session.userId });
    const addressToEdit = userData.address.find(
      (address) => address._id.toString() === addressId
    );

    if (addressToEdit) {
      res.render("editAddress", { addressToEdit });
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// const editADD = async (req, res) => {
//   try {
//     const { addressId } = req.query;
//     console.log("shbdh", addressId);
//     const { name, city, housename, state, phone, pincode } = req.body;
//     console.log("hii", req.body);
//     const id = req.session.userId;
//     const user = await User.findOne({ _id: id });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     console.log("sdj", id);
//     const updatedUser = await User.findOneAndUpdate(
//       { _id: id },
//       {
//         $set: {
//           "address.$[address].name": name,
//           "address.$[address].phone": phone,
//           "address.$[address].pincode": pincode,
//           "address.$[address].city": city,
//           "address.$[address].housename": housename,
//           "address.$[address].state": state,
//         },
//       },
//       {
//         arrayFilters: [ { "address._id": addressId } ],
//         new: true
//       }
//     )
//     if (!updatedUser) {
//       return res.status(404).json({ error: "Address not found" });
//     }
//     res.redirect("/profile/address");
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

const deleteAddress = async (req, res) => {
  try {
    const addressIdToDelete = req.params.addressId;
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { $pull: { address: { _id: addressIdToDelete } } },
      { new: true }
    );
    res.redirect("/profile/address");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


// const loadCart = async (req, res) => {
//   try {
   
//     const loadLogin = req.session.user_id
//     const userId = await User.findOne({ _id: req.session.user_id})
//     const id = req.session.user_id
//     const userCart = await Cart.findOne({ user: req.session.user_id }).populate('items.product_id')

//     console.log(userId,"iMMM");
//     console.log(userCart,"ioo");
    
//     if (userCart) {
//       const products = userCart.items;
//       if (products.length > 0) {
//         for (const product of products) {
//           product.total = product.price * product.quantity;
//         }
//         const total = await Cart.aggregate([
//           { $match: { user: userId } },
//           { $unwind: "$items" },
//           {
//             $project: {
//               price: "$items.price",
//               quantity: "$items.quantity",
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               total: { $sum: { $multiply: ["$price", "$quantity"] } },
//             },
//           },
//         ]);
//         const Total = total[0].total;
//         const userID = userId;

//         res.render("cart", {
//           user: userId.name,
//           products: products,
//           Total,
//           userID,
//         });
//       }
//     }
//   } catch (error) {

//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };



const loadCart = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const userCart = await Cart.findOne({ user_id: userId }).populate(
      "items.product_id"
    );
    console.log(userCart);
    const cartProducts = userCart ? userCart.items : [];

    const totalPriceSum = cartProducts.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    res.render("cart", {
      cartProducts,
      totalPriceSum,
      currentUser: req.session.user_id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addToCart = async (req, res) => {
  try {
    console.log("add to cart request received ", req.body);
    const userId = req.user._id;
    const productId = req.body.productId;
    const quantity = req.body.quantity;
    console.log("my productid", productId);

    let userCart = await Cart.findOne({ user_id: userId });

    if (!userCart) {
      userCart = new Cart({
        user_id: userId,
        items: [],
      });
    }
    const existingProduct = userCart.items.find(
      (item) => item.product_id === productId
    );
    if (existingProduct) {
      try {
        const Product = await product.findById(productId);
        if (!Product) {
          console.error(`Product with id ${productId} not found.`);
          return res
            .status(404)
            .send(`Product with id ${productId} not found.`);
        }

        const availableQuantity = Product.quantity;

        if (existingProduct.quantity < availableQuantity) {
          existingProduct.quantity += 1;
          existingProduct.total_price =
            existingProduct.quantity * Product.price;
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        return res.status(500).send("Internal Server Error");
      }
    } else {
      try {
        const Product = await product.findById(productId);

        if (!Product) {
          console.error(`Product with id ${productId} not found.`);
          return res
            .status(404)
            .send(`Product with id ${productId} not found.`);
        }

        const productToAdd = {
          product_id: productId,
          quantity: quantity,
          price: Product.price,
          total_price: quantity * Product.price,
        };

        userCart.items.push(productToAdd);
      } catch (error) {
        console.error("Error fetching product details:", error);
        return res.status(500).send("Internal Server Error");
      }
    }

    await userCart.save();
    const cartTotals = userCart.items.reduce(
      (sum, item) => sum + item.total_price,
      0
    );

    res.render("cart", {
      cartProducts: userCart.items,
      totalPriceSum: cartTotals,
      currentUser: req.session.user_id,
    });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).send("Internal Server Error");
  }
};
    



        // const availableQuantity = Product.quantity;
        // if(existingProduct.quantity < availableQuantity) {
        //   existingProduct.quantity += 1
        //   existingProduct.total_price =
        //   existingProduct.quantity * Product.price;
        // }


//       } catch (error) {
//         console.error("Error fetching product details:", error);
//         return res.status(500).send("Internal Server Error");
//       }
//     } else {
//       try {
//         const Product = await product.findById(productId);
//         if (!Product) {
//           console.error(`Product with id ${productId} not found.`);
//           return res
//             .status(404)
//             .send(`Product with id ${productId} not found.`);
//         }

//         const productToAdd = {
//           product_id: productId,
//           quantity: quantity,
//           price: Product.price,
//           total_price: quantity * Product.price,
//         };

//         userCart.items.push(productToAdd);
//       } catch (error) {
//         console.error("Error fetching product details:", error);
//         return res.status(500).send("Internal Server Error");
//       }
//     }
//     await userCart.save();
//     const cartTotals = userCart.items.reduce(
//       (sum, item) => sum + item.total_price,
//       0
//     );
//     res.render("cart", {
//       cartProducts: userCart.items,
//       totalPriceSum: cartTotals,
//       currentUser: req.session.user_id,
//     });
//   } catch (error) {
//     console.error("Error adding product to cart:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };




// const quantityChange = async(req,res)=>{
//   try {
//     const count = req.body.count
//     // console.log(count,"tell me");
//     const product_id = req.body.product_id
//     // console.log(product_id,"hhhhhhhh");

//     const cart = Cart.await.findOne({ user: req.session.user_id})
//     console.log(cart,"as");
//     const products = product.findOne({_id: product_id})
//     console.log(products,"ppppp");

//     const cartProduct = Cart.product.find(
//       (product) => product.product_Id.toString() === product_Id
//     )

//     if(count == 1){
//       if(cartProduct)
//     }
  

//   } catch (error) {
//    console.log(error); 
//   }
// }
 

const removeProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.body.productId;

    const userCart = await Cart.findOne({ user_id: userId });

    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    userCart.items = userCart.items.filter(
      (item) => item.product_id.toString() !== productId
    );

    await userCart.save();

    res.json({ success: true, message: "Product removed from cart" });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const ITEMS_PER_PAGE = 3;

const loadSingle = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await product.findOne({ _id: id });
    res.render("productDetails", { product: productData });
  } catch (error) {
    console.log(error);
  }
};

const loadAbout = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    console.log(error);
  }
};

const loadCheckout = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    const userCart = await Cart.findOne({ user_id: req.session.userId });
    

    let totalPrice = 0;
    if (userCart && userCart.items) {
      userCart.items.forEach((item) => {
        const itemTotal = parseFloat(item.price);
        totalPrice += itemTotal;
      });
    }
    res.render("checkout", { Data: userData, cart: userCart, totalPrice });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadCheckAdd = async (req, res) => {
  try {
    res.render("checkAdd");
  } catch (error) {
    console.log(error);
  }
};

const generateCustomUserId = () => {
  const prefix = "";
  const uniqueId = Math.floor(Math.random() * 1000000);

  return `${prefix}${uniqueId}`;
};

const placeOrder = async (req, res) => {
  try {
    console.log("place Order :", req.body);
    const date = new Date();
    const user_id = req.session.userId;
    const { address, paymentMethod } = req.body;
    const delivery_address = address;

    // console.log(1234,req.body);

    const cartData = await Cart.findOne({ user_id: user_id });

    if (!cartData) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found for the user." });
    }
    const userData = await User.findById(user_id);

    if (!userData) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    const cartProducts = cartData.items || [];

    const totalAmount = cartProducts.reduce(
      (total, item) => total + item.total_price,
      0
    );

    let status = paymentMethod === "COD" ? "placed" : "pending";

    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    const orderIdPrefix = "RZS";
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomOrderId =
      orderIdPrefix +
      Array.from(
        { length: 9 },
        () => randomChars[Math.floor(Math.random() * randomChars.length)]
      ).join("");

    const orderData = new order({
      user_id: user_id,
      delivery_address,
      user_name: userData.username,
      total_amount: totalAmount,
      date: Date.now(),
      expected_delivery: deliveryDate,
      payment: paymentMethod,
      order_id: randomOrderId,
      items: cartProducts.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total_price,
        ordered_status: status,
        discountPerItem: item.discountPerItem,
        cancellationReason: item.cancellationReason,
      })),
    });

    let orders = await orderData.save();
    const orderId = orders._id;
    console.log(77668, orders);
    if (status === "placed") {
      const cartDelete = await Cart.deleteOne({ user_id: user_id });
      res.json({ success: true, orderId });
    } else if (status == "RazorPay") {
      var options = {
        amount: orders.total_amount * 100,
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(options, function (err, order) {
        res.send({ status: "razer", order: order });
        console.log(88888, order);
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const orderConfirmation = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.userId });
    console.log(req.params.orderId);

    const orderId = req.params.orderId;
    const orderDetails = await order.findById(orderId);
    if (!orderDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    res.render("orderConfirmation", { orderDetails, userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const loadData = async (req, res) => {
  try {
    const { email } = req.query;
    res.render("otp", { email });
  } catch (error) {}
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

const viewDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.userId;

    console.log("my view", userId);
    console.log("my order", orderId);

    const orders = await order
      .findOne({ _id: orderId, user_id: userId })
      .populate({
        path: "items.product_id",
        model: "product",
      });
    console.log("Orders:", orders);

    const user = await User.findById(userId);

    res.render("viewDetails", { orders, user });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { productIds } = req.body;

    // Update the status of each product in the order
    const updatedOrders = await Promise.all(productIds.map(async productId => {
      const updatedOrder = await order.findOneAndUpdate(
        { 'items.product_id': productId },
        { $set: { 'items.$.ordered_status': 'Cancelled' } },
        { new: true }
      );
      return updatedOrder;
    }));

    return res.status(200).json({ message: "Orders cancelled successfully", updatedOrders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
const checkAdd = async (req, res) => {
  try {
    const { name, housename, city, state, phone, pincode } = req.body;

    const newAddress = {
      name,
      housename,
      city,
      state,
      phone,
      pincode,
    };

    await User.findByIdAndUpdate(
      req.session.userId,
      { $push: { address: newAddress } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  loadHome,
  loadShop,
  loadAbout,
  loadContact,
  loadCheckout,
  placeOrder,
  loadCart,
  addToCart,
  removeProduct,
  viewDetails,
  loadData,
  logout,
  loadSingle,

  loadProfile,
  editProfile,
  updateProfile,
  userOrders,
  laodUsersAddress,

  addAddress,
  saveAddress,
  editAddress,
  // editADD,
  deleteAddress,
  loadCheckAdd,

  //check
  checkAdd,

  // Login
  loadLogin,
  loadForget,
  forgetPasswordVerify,
  resetPasswordLoad,
  resetpassword,
  loadSign,
  verifySignup,
  verifyOtp,
  verifyLogin,
  resendOTP,
  generateCustomUserId,

  cancelOrder,
  orderConfirmation,
};
