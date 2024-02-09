const product = require("../model/product");
const Category = require("../model/category");
const sharp = require("sharp");
const path = require("path");
const { log } = require("console");

const loadProducts = async (req, res) => {
  try {
    const productData = await product.find({});
    res.render("products", { products: productData });
  } catch (error) {
    console.log(error);
  }
};


const loadAddProducts = async (req, res) => {
  try {
    const data = await Category.find({ is_listed: true });
    res.render("addProducts", { category: data });
  } catch (error) {
    console.log(error);
  }
};


const addProducts = async (req, res) => {
  try {
    const existProduct = await product.findOne({ name: req.body.productName });
    if (existProduct) {
      res.status(404).send({ message: "category already exist" });
    } else {
      const {
        productName,
        description,
        quantity,
        price,
        category,
        brand,
        date,
      } = req.body;
      const filenames = [];
      console.log(req.body);

      
      const selectedCategory = await Category.findOne({ name: category });
      const data = await Category.find({ is_listed: true });
      //console.log(123);


      if (req.files.length !== 4) {
        return res.render("addProducts", {
          message: "4 images needed",
          category: data,
        });
      }
      //console.log(req.body);
      // resize and save each uploaded images
      for (let i = 0; i < req.files.length; i++) {
        const imagesPath = path.join(
          __dirname,
          "../public/sharpImage",
          req.files[i].filename
        );
        console.log(imagesPath);
        await sharp(req.files[i].path)
          .resize(800, 1200, { fit: "fill" })
          .toFile(imagesPath);
        filenames.push(req.files[i].filename);
      }
      //console.log('huuyi')
      const newProduct = new product({
        name: productName,
        description,
        quantity,
        price,
        image: filenames,
        category: selectedCategory._id,
        brand: brand,
        date,
      });
      const a = await newProduct.save();
      console.log(a);
      res.redirect("/admin/products");
    }
  } catch (error) {}
};

const loadEditProduct = async (req, res) => {
  try {
    const productsId = req.query.productsId;
    const data = await product.findOne({ _id: productsId });
    const category = await Category.find({ is_listed: true });

    res.render("editProducts", { products: data, category: category });
  } catch (error) {
    console.log(error);
  }
};


const editProducts = async (req, res) => {
  try {
    const id = req.query.productsId;
    const { productName, description, quantity, price, brand, category } =
      req.body;
    console.log(id);

    // Find the selected category by name
    const selectedCategory = await Category.findOne({ name: category });

    // Check if the category is found
    if (!selectedCategory) {
      return res.status(404).send({ message: "Selected category not found" });
    }

    // Update the product
    const updatedProduct = await product.findByIdAndUpdate(
      { _id: id },
      {
        name: productName,
        description,
        quantity,
        price,
        brand,
        category: selectedCategory._id,
      },
      { new: true }
    );

    console.log(updatedProduct);
    req.flash("message", "Product updated successfully");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    // Handle the error appropriately
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const products = req.query.productsId;
    await product.deleteOne({ _id: products });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  loadProducts,
  loadAddProducts,
  addProducts,
  loadEditProduct,
  editProducts,
  deleteProduct,
};
