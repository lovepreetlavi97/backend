const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables
console.log(process.env.MONGODB_URI,"process.env.MONGODB_URI")
const connectDB = async () => {
    try {
        // Use the connection URI from the environment variables
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB connected');

        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
