<<<<<<< HEAD
require('dotenv').config()
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Mongo URI:", process.env.MONGO_URI);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
=======

  const mongoose = require('mongoose');

  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log("Mongo URI:", process.env.MONGO_URI);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };

  module.exports = connectDB;
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
