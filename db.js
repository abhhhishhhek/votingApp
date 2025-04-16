const mongoose = require('mongoose')
require('dotenv').config()

// Define the mongoDB connection URL
const mongoURL = process.env.MONGODB_URL_LOCAL     //'mongodb://localhost:27017/mydatabase' //  ye local url hai, can replace 'mydatabase' with your database name
//const mongoURL = process.env.MONGODB_URL

//set up MongoDB connection
mongoose.connect(mongoURL,{})

const db = mongoose.connection;

// Define event listeners for database connection

db.on('connected',()=>{
    console.log('Connected to MongoDB server')
})

db.on('error',(err)=>{
    console.log('Mongoose connection error:',err)
})

db.on('disconnected',()=>{
    console.log('MongoDB disconnected')
})

// Export the database connection
module.exports = db;