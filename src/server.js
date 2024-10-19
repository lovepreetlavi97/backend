const app = require('./app'); // Import the app
const socketIo = require('socket.io');

// Start the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Socket.io setup
const io = socketIo(server, {
    cors: {
        origin: '*', // Adjust for production security
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    // Add game-related socket events here

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
