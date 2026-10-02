const express = require("express");

const { checkSms } = require("../controllers/sms.controller");

const router = express.Router();

router.post("/check", checkSms);

module.exports = router;
