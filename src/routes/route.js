const express = require('express');
const router = express.Router();
const urlshort = require("../controller/urlCcontroller")


router.post("/url/shorten", urlshort.createShortUrl)
router.get("/:urlCode", urlshort.getUrl)


module.exports = router;
