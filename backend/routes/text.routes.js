const express = require("express");
const { verifyText } = require("../controllers/text.controller");

const router = express.Router();

router.post("/text", verifyText);

module.exports = router;
