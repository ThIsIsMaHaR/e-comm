const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_super_secret_key'; // In a real app, use environment variables

app.use(express.json());
app.use(cors());

// --- Mock Database (In-memory storage) ---
// In a production app, this would be a real database like MongoDB
const users = [];
const products = [
    { id: 1, name: "Vintage Camera", price: 299, category: "Electronics" },
    { id: 2, name: "Leather Jacket", price: 150, category: "Apparel" },
    { id: 3, name: "Coffee Maker", price: 75, category: "Home Goods" },
    { id: 4, name: "Stylish Backpack", price: 80, category: "Accessories" },
    { id: 5, name: "Wireless Headphones", price: 120, category: "Electronics" },
    { id: 6, name: "Running Shoes", price: 95, category: "Apparel" },
];

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Authentication APIs ---

// User Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword };
    users.push(user);

    res.status(201).send('User created successfully.');
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user == null) {
        return res.status(400).send('Cannot find user.');
    }

    if (await bcrypt.compare(password, user.password)) {
        const accessToken = jwt.sign({ name: user.username }, SECRET_KEY);
        res.json({ accessToken: accessToken, username: user.username });
    } else {
        res.status(401).send('Incorrect password.');
    }
});

// --- Item CRUD APIs (with filters) ---

// Get all products (can be filtered by category or price range)
app.get('/api/items', (req, res) => {
    const { category, minPrice, maxPrice } = req.query;
    let filteredProducts = [...products];

    if (category) {
        filteredProducts = filteredProducts.filter(item => item.category === category);
    }
    if (minPrice) {
        filteredProducts = filteredProducts.filter(item => item.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter(item => item.price <= parseFloat(maxPrice));
    }

    res.json(filteredProducts);
});

// Add a new item (protected route)
app.post('/api/items', authenticateToken, (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price || !category) {
        return res.status(400).send('Name, price, and category are required.');
    }
    const newItem = { id: products.length + 1, name, price, category };
    products.push(newItem);
    res.status(201).json(newItem);
});

// Update an item (protected route)
app.put('/api/items/:id', authenticateToken, (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = products.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).send('Item not found.');
    }
    products[itemIndex] = { ...products[itemIndex], ...req.body };
    res.json(products[itemIndex]);
});

// Delete an item (protected route)
app.delete('/api/items/:id', authenticateToken, (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = products.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).send('Item not found.');
    }
    products.splice(itemIndex, 1);
    res.status(204).send();
});

// --- Add to Cart API ---

// Simulate add to cart (in a real app, this would update a user's cart in the DB)
app.post('/api/cart/add', authenticateToken, (req, res) => {
    const { itemId, quantity } = req.body;
    // Log cart action for demonstration
    console.log(`User ${req.user.name} added item ${itemId} with quantity ${quantity} to cart.`);
    res.status(200).send('Item added to cart successfully.');
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
