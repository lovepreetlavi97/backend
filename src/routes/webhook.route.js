const express = require("express");
const router = express.Router();
const {
razorpayWebhookHandler
} = require("../controllers/webhook.controller.js");

// for webhook — DO NOT use bodyParser.json here
router.post(
  "/",
   express.raw({ type: "*/*" }),
  razorpayWebhookHandler
);



module.exports = router;
