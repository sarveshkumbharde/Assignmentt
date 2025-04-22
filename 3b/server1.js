// server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
// or use body-parser:
// app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://omkar11:omkar123@cluster0.gzs1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define a Mongoose schema and model for User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Remove password field from the output when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

//
// API Endpoints
//

// 1. Register User: Create a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login User: Verify user credentials
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    // For simplicity, we return user data; in a real app, issue a token.
    res.json({ message: 'Login successful', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Show User Data: Retrieve user details by ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update User Data: Update user details by ID
app.put('/api/user/:id', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    // If password is provided, hash the new password
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/user/:id', async (req, res) => {
   try {
     const deletedUser = await User.findByIdAndRemove(req.params.id);
     if (!deletedUser) {
       return res.status(404).json({ error: 'User not found' });
     }
     res.json({ message: 'User deleted successfully' });
   } catch (err) {
     res.status(500).json({ error: err.message });
   }
 });

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
