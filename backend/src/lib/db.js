import mongoose from 'mongoose';

export const connectDB = () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/raja-mantri-game';
  
  mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Please make sure MongoDB is running on your system');
    console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
  });
}
