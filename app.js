const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config.js");
const app = express();
const PORT = process.env.PORT || 3005;
app.use(express.json());
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000'
];

// CORS options with a dynamic origin check
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials
};

// Use the CORS middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("images"));
const ProductRouter=require('./Router/ProductRouter.js')
const GiftCardRouter=require('./Router/GiftCardRouter.js')
const LoginRouter=require('./Router/LoginRouter.js')
const UserAddressRouter=require('./Router/UserAddressRouter.js')
const CartRouter=require('./Router/CartRouter.js')
const WrapGiftRouter=require('./Router/WrapGiftRouter.js')
const ResetPasswordRouter=require('./Router/ResetPasswordRouter.js')
const OrdersRouter=require('./Router/OrdersRouter.js')
const SliderRouter=require('./Router/SliderRouter.js')
const WalletRouter=require('./Router/WalletRouter.js')
const FeedbackRouter=require('./Router/FeedbackRouter.js')
const DiscountCodeRouter=require('./Router/DiscountCodeRouter.js')
app.use('/product',ProductRouter)
app.use('/giftcard',GiftCardRouter)
app.use('/auth',LoginRouter)
app.use('/address',UserAddressRouter)
app.use('/cart',CartRouter)
app.use('/wrapgift',WrapGiftRouter)
app.use('/changepassword',ResetPasswordRouter)
app.use('/orders',OrdersRouter)
app.use('/slider',SliderRouter)
app.use('/wallet',WalletRouter)
app.use('/feedback',FeedbackRouter)
app.use('/discountcode',DiscountCodeRouter)
app.get("/", (req, res) => {
    res.send("Welcome to Hadiyyeh! ");
  });
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
  
