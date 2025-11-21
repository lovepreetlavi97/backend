// // server.js
// const app = require('./app'); // Corrected path to app.js

// // Start the server
// const port = process.env.PORT || 5000; // Default port is 5000
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });
const cluster = require("cluster");
const os = require("os");

// Check if this is the master process
// if (cluster.isPrimary) {
//     const numCPUs = os.cpus().length; // Get the number of CPU cores
//     console.log(`Master process ${process.pid} is running with ${numCPUs} CPUs available`);

//     // Fork workers (one per CPU core)
//     for (let i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }

//     // Handle worker failures and restart them
//     cluster.on("exit", (worker, code, signal) => {
//         console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
//         console.log('Starting a new worker');
//         cluster.fork();
//     });
// } else {
    // Worker process - run the Express app
    const app = require("./app");
    const port = process.env.PORT || 5000;
    
    app.listen(port, () => {
        console.log(`Worker ${process.pid} started, running on http://localhost:${port}`);
    });
// }
