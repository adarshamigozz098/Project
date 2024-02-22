const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const category = require("../model/category");
const order = require("../model/order");
const product = require("../model/product");
const moment = require('moment')

const loadAdmin = async(req,res)=>{
  try {
    const ordersCount = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": { $ne: "Pending" }
        }
      },
      {
        $group:
        {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [
                { $eq: ["$items.ordered_status", "Delivered"] },
                1,
                0
              ]
            }
          },
          otherOrders: {
            $sum: {
              $cond: [
                { $ne: ["$items.ordered_status", "Delivered"] },
                1,
                0
              ]
            }
          },
          cancelOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$items.ordered_status", "Cancelled"] },
                    { $eq: ["$items.ordered_status", "Returned"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])
    const totalOrder = ordersCount.length != 0 ? ordersCount[0].totalOrders : 0
    const deliveredOrders = ordersCount.length != 0 ? ordersCount[0].deliveredOrders : 0
    const otherOrders = ordersCount.length != 0 ? ordersCount[0].otherOrders : 0
    const cancelOrders = ordersCount.length != 0 ? ordersCount[0].cancelOrders : 0
    console.log("my orders count", ordersCount)

    // TOTAL REVENUE
    const totalSales = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "Delivered"
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
        },
      },
    ])
    const totalSale = totalSales.length != 0 ? totalSales[0].totalRevenue : 0
    console.log("total sales revenue", totalSales)

      // =============PRODUCT AND CATEGORY COUNT================
      const productCount = await product.countDocuments({})
      const categoryCount = await category.countDocuments({})


      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      console.log("Start of day:", startOfDay);
      console.log("End of day:", endOfDay);
      
      const dailyEarnings = await order.aggregate([
        {
          $unwind: "$items"
        },
        {
          $match: {
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            "items.ordered_status": "Delivered"
          },
        },
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: {
                $subtract: [
                  { $multiply: ["$items.quantity", "$items.price"] },
                  "$items.discountPerItem"
                ]
              }
            },
          },
        },
      ]);
      
      console.log("Daily earnings aggregation result:", dailyEarnings);  
      const dailyEarn = dailyEarnings.length !== 0 ? dailyEarnings[0].totalSales : 0;
      console.log("My daily sales", dailyEarn);
      
      
     // =================MONTHLY EARNINGS========================
    const monthlyEarnings = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          "items.ordered_status": "Delivered"
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ])

    const monthlyEarn = monthlyEarnings.length != 0 ? monthlyEarnings[0].totalSales : 0
    console.log("my monthly sales", monthlyEarnings)

    const currentYear = new Date().getFullYear();
    const yearsToInclude = 7;
    const currentMonth = new Date().getMonth() + 1

    const deafultMonthlyValues = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }))

    const defaultYearlyValues = Array.from({ length: yearsToInclude }, (_, i) => ({
      year: currentYear - yearsToInclude + i + 1,
      total: 0,
      count: 0,
    }))


    // monthely salesData Graph
    const monthlySalesData = await order.aggregate([
      {
        $unwind: "$items"

      },
      {
        $match: {
          "items.ordered_status": "Delivered",
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: '$total',
          count: '$count'
        }
      }
    ])

    const updatedMonthlyValues = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlySalesData.find((monthData) => monthData.month === defaultMonth.month)
      return foundMonth || defaultMonth
    })

    console.log("monthly Sales Data", updatedMonthlyValues);


    
    
    //========================= yearly SalesData graph======================

    const yearlySalesData = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "Delivered",
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: '$createdAt' },
          total: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          total: "$total",
          count: "$count",
        }
      }
    ])

    const updatedYearlyValues = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlySalesData.find((yearData) => yearData.year === defaultYear.year)
      return foundYear || defaultYear
    })

    console.log(" yearly sales Data", updatedYearlyValues);


    // =================monthly orders==========================
    const monthlyOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "Delivered",
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalOrders: { $sum: 1 }
        },
      },
    ])

    const updatedMonthlyOrders = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlyOrders.find(
        (monthData) => monthData._id === defaultMonth.month)
      return { month: defaultMonth.month, totalOrders: foundMonth ? foundMonth.totalOrders : 0 };
    })

    console.log("monthly orders", updatedMonthlyOrders);


     // ========================yearly orders======================
     const yearlyOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "Delivered",
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalOrders: { $sum: 1 }
        },
      },
    ])

    const updatedYearlyOrders = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlyOrders.find(
        (yearData) => yearData._id === defaultYear.year
      )
      return { year: defaultYear.year, totalOrder: foundYear ? foundYear.totalOrders : 0 }
    })

    console.log("yearly orders", updatedYearlyOrders);



     // =============================monthly users===========================
     const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 },
        }
      }
    ])
    const updatedMonthlyUsers = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlyUsers.find(
        (monthData) => monthData._id === defaultMonth.month
      )
      return { month: defaultMonth.month, totalUsers: foundMonth ? foundMonth.totalUsers : 0 };
    })

    console.log("my monthlytotal users", updatedMonthlyUsers);


      // =============================yearly users===================================
      const yearlyUsers = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
          },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            totalUsers: { $sum: 1 }
          }
        }
      ])
      const updatedYearlyUsers = defaultYearlyValues.map((defaultYear) => {
        const foundYear = yearlyUsers.find(
          (yearData) => yearData._id === defaultYear.year
        )
        return { year: defaultYear.year, totalUsers: foundYear ? foundYear.totalUsers : 0 }
      })
      console.log("my yearlytotal users", updatedYearlyUsers);
         // latest orders
    const latestOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": { $ne: "pending" }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: 10
      },
    ])


      // new users
      const latestUsers = await User.find({ verified: true }).sort({ createdAt: -1 }).limit(5)




     res.render("adminDash",{ 
      totalOrder,
      deliveredOrders,
      otherOrders,
      cancelOrders,
    
      productCount,
      categoryCount,
   
      totalSale,
      monthlyEarn,

      //daily 
      dailyEarn, 
     
      updatedMonthlyValues,
      updatedMonthlyOrders,
      updatedYearlyValues,
      updatedYearlyOrders,
      updatedMonthlyUsers,
      updatedYearlyUsers,

      latestOrders,
      latestUsers,    
      moment
    })
  } catch (error) {
    console.log(error);
  }
}

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


const logoutAdmin = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying admin session:", err);
    }
    res.redirect("/admin");
  });
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
      res.render("categoryEdit", {
        message: "Category already exists",
        Data: existingCategory,
      });
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
      path: "items.product_id",
      model: "product",
      select: "name",
    });

    for (const order of Orders) {
      const user = await User.findById(order.user_id);
      order.username = user.username;

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.product_id) {
            item.product_name = item.product_id.name;
          } else {
            item.product_name = "Product not found";
          }
        }
      } else {
        order.items = [];
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
    const Order = await order
      .findOne({ order_id: orderId })
      .populate("items.product_id");
    console.log(Order);
    if (!Order) {
      return res.status(404).send("Order not found.");
    }

    const productId = Order.items[0].product_id._id;

    res.render("adminOrderDetail", { Order: Order, productId: productId });
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while loading order detail.");
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, productId } = req.body;
    console.log(req.body, "bodyy");

    const result = await order.updateOne(
      { order_id: orderId, "items.product_id": productId },
      { $set: { "items.$.ordered_status": status } }
    );
    console.log(result);

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: "Order status updated successfully" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Order or Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const salesReport = async (req, res) => {
  try {
    const firstOrder = await order.findOne().sort({ createdAt: 1 })
    const lastOrder = await order.findOne().sort({ createdAt: -1 })

    const salesReport = await order.find({ "items.ordered_status": "Delivered" })
      .populate("user_id")
      .populate("items.product_id")
      .sort({ createdAt: -1 })

    res.render('salesReport', {
      firstOrder: moment(firstOrder.createdAt).format("YYYY-MM-DD"),
      lastOrder: moment(lastOrder.createdAt).format("YYYY-MM-DD"),
      salesReport,
      moment
    })
  } catch (error) {
    console.error(error);
  }
}
  


const datePicker = async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    const startDateObj = new Date(startDate)
    startDateObj.setHours(0, 0, 0, 0)
    const endDateObj = new Date(endDate)
    endDateObj.setHours(23, 59, 59, 999)

    const selectedDate = await order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
          "items.ordered_status": "delivered"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        }
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "items.product"
        }
      },
      {
        $unwind: "$items.product",
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          delivery_address: { $first: "$delivery_address" },
          order_id: { $first: "$order_id" },
          date: { $first: "$date" },
          payment: { $first: "$payment" },
          items: { $push: "$items" }
        }
      }
    ])

    res.status(200).json({ selectedDate: selectedDate });
  } catch (error) {
    console.log(error);
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
  updateOrderStatus,
  // loadDashboard
  salesReport,
  datePicker
}
