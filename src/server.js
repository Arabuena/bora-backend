const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}); 