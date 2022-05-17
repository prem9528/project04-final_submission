const express = require('express');
const router = express.Router();
const urlshort = require("../controller/urlCcontroller")


router.post("/url/shorten", urlshort.createShortUrl)


module.exports = router;
