// server.js

const app = require('./app'); // Import the app

// Start the server
const port = process.env.PORT || 3000; // Use 5000 as default if PORT is not set
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
