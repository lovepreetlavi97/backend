const express = require('express');
const welcomeRoute = require('./welcome.route');

const router = express.Router();

router.use('/', welcomeRoute); // Register your welcome route

module.exports = router;
