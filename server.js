const express = require('express');
const connectDB = require('./config/db');

const app = express();

// connect to DB
connectDB();

// Init middlewares
app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
    res.send('API running');
});

app.use('/api', require('./routes/api'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
