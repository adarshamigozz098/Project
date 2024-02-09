const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const category = require("../model/category");



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
      res.render("adminLogin", { message: "admin not found" });
    } else {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isAdmin == 1) {
          res.redirect("/admin/dashboard?message=Login successful");
        } else {
          res.render("adminLogin", {
            message:
              "Email and password are correct, but the user is not an admin.",
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




const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/adminLogin");
  } catch (error) {
    console.log(error);
  }
};




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
    console.log(req.body);

    const newCategory = new category({
      name: productName,
      description: description,
    });

    await newCategory.save();
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
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
    console.log('ex',existingCategory)

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





module.exports = {
  loadUsers,
  loadCategory,
  verifyLogin,
  loadLogin,
  loadAdmin,
  blockUnblockUser,
  logout,
  addCategory,
  deleteCategory,
  listOrUnlist,
  loadeditCategory,
  editCategory,
};



