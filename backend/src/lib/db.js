import mongoose from 'mongoose';

let connectionPromise;

export const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/raja-mantri-game';

  connectionPromise = mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    return mongoose.connection;
  })
  .catch((err) => {
    connectionPromise = null;
    console.error('MongoDB connection error:', err);
    console.log('Please make sure MongoDB is running on your system');
    console.log('You can install MongoDB from: https://www.mongodb.com/try/download/community');
    throw err;
  });

  return connectionPromise;
}
