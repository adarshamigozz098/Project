const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://adarsh:adarsh123@cluster0.bpd2vtg.mongodb.net/"
);

const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(
  session({
    secret: "adarsh",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.static(path.resolve(__dirname, "public")));
app.use(flash());

const userRouter = require("./routes/userRouter");
app.use("/", userRouter);

const adminRouter = require("./routes/adminRouter");
app.use("/admin", adminRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`server started running on http://localhost:${PORT}`);
});
