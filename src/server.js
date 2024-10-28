// server.js
const app = require('./app'); // Corrected path to app.js

// Start the server
const port = process.env.PORT || 3000; // Default port is 5000
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
