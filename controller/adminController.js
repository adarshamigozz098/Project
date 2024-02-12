const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const category = require("../model/category");
const order = require("../model/order")



const loadLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error);
  }
};



const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email: email });

    if (!userData) {
      res.render("adminLogin", { message: "Admin not found" });
    } else {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isAdmin == 1) {
          req.session.adminId = userData._id;
          req.session.isAdmin = true;

          res.redirect("/admin/dashboard?message=Login successful");
        } else {
          res.render("adminLogin", {
            message: "Email and password are correct, but the user is not an admin.",
          });
        }
      } else {
        res.render("adminLogin", { message: "Incorrect email and password" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};




const loadAdmin = async (req, res) => {
  try {
    res.render("adminDash");
  } catch (error) {
    console.log(error);
  }
};



const loadUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.render("users", { users });
  } catch (error) {
    console.log(error);
  }
};



const blockUnblockUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log(req.body);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.redirect("/admin/users");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const logoutAdmin = async(req,res)=>{
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying admin session:', err);
    }
    res.redirect('/admin');
  });
}




const loadCategory = async (req, res) => {
  try {
    const categoryData = await category.find();
    console.log(categoryData);
    res.render("category", { categoryData });
  } catch (error) {
    console.log(error);
  }
};



const addCategory = async (req, res) => {
  try {
    const { productName, description } = req.body;
    if (!productName || !description) {
      req.flash("error", "Name and description are required.");
      return res.redirect("/admin/category");
    }
    const existingCategory = await category.findOne({ name: productName });

    if (existingCategory) {
      req.flash("error", "Category with the same name already exists.");
      return res.redirect("/admin/category");
    }
    const newCategory = new category({
      name: productName,
      description: description,
    });

    await newCategory.save();
    return res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    req.flash("error", "Internal Server Error");
    return res.redirect("/admin/category");
  }
};



const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    await category.deleteOne({ _id: categoryId });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



const listOrUnlist = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const categoryData = await category.updateOne({ _id: categoryId });
    categoryData.is_listed = !categoryData.is_listed;
    console.log(categoryData);
  } catch (error) {
    console.log(error);
  }
};



const loadeditCategory = async (req, res) => {
  try {
    const data = await category.findOne({ _id: req.query.Data });
    res.render("categoryEdit", { Data: data });
  } catch (error) {
    console.log(error);
  }
};



const editCategory = async (req, res) => {
  try {
    const id = req.body.categoryId;
    const name = req.body.product_name.toUpperCase();
    const description = req.body.product_description.toUpperCase();
    const existingCategory = await category.findOne({ name: name });
    if (existingCategory) {
       res.render("categoryEdit", { message: "Category already exists",Data:existingCategory });
    } else {
      const updateCategory = await category.updateOne(
        { _id: id },
        { $set: { name: name, description: description } }
      );

      res.redirect("/admin/category");
      }
  } catch (error) {
    console.log(error);
  }
};



const loadOrder = async (req, res) => {
  try {
    const Orders = await order.find().populate({
      path: 'items.product_id',
      model: 'product',
      select: 'name' // Include the 'name' field in the populated 'product' data
    });

    for (const order of Orders) {
      const user = await User.findById(order.user_id);
      order.username = user.username;

      for (const item of order.items) {
        
      }
    }

    res.render("adminOrders", { Orders });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const loadDetail = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const Order = await order.findOne({ order_id: orderId }).populate('items.product_id');
    console.log(Order);
    if (!Order) {
      return res.status(404).send('Order not found.');
    }

    const productId = Order.items[0].product_id._id;

    res.render('adminOrderDetail', { Order: Order, productId: productId });
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred while loading order detail.');
  }
};



const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, productId } = req.body;
    console.log(req.body, "bodyy");

    const result = await order.updateOne(
      { "order_id": orderId, "items.product_id": productId },
      { $set: { "items.$.ordered_status": status } }
    );
    console.log(result);

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: 'Order status updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Order or Product not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}




module.exports = {
  loadUsers,
  loadCategory,
  verifyLogin,
  loadLogin,
  loadAdmin,
  blockUnblockUser,
  logoutAdmin,
  addCategory,
  deleteCategory,
  listOrUnlist,
  loadeditCategory,
  editCategory,
  loadOrder,
  loadDetail,
  updateOrderStatus
};



