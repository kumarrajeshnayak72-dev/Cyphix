const express = require("express");
const { verifyMail } = require("../controllers/mail.controller");

const router = express.Router();

router.post("/mail", verifyMail);

module.exports = router;

