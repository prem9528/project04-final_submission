const validUrl = require('valid-url')
const shortid = require('shortid')
const UrlModel = require("../models/urlmodel")
const redis = require("redis");
const { promisify } = require("util");

//***********************************CONNECT TO REDIS********************************************** */
const redisClient = redis.createClient(
    14645,
    "redis-14645.c212.ap-south-1-1.ec2.cloud.redislabs.com", { no_ready_check: true }
);

redisClient.auth("NLBmwO9GfmBfyDklW8eutoQSyWOENswG", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//********************************************VALIDATION FUNCTIONS********************************************************** */

const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length > 0) return true;
    return false;
};

const isValidRequest = function (object) {
    return Object.keys(object).length > 0;
};

// using regex for validating url
const isValidUrl = function (value) {
    let regexForUrl =
        /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/;
    return regexForUrl.test(value);
};

//*************************************LOGIC CODE************************************************ */

const createShortUrl = async function (req, res) {
    try {
        const requestBody = req.body;
        let longUrl = req.body.longUrl
        let baseUrl = "localhost:3000"

        // if (!validUrl.isUri(baseUrl)) {
        //     return res.status(401).json('Invalid base URL')
        // }
        if (!isValidRequest(requestBody)) {
            return res.status(400).send({ status: false, message: "data is required" });
        }
        // if requestBody has more than one key
        if (Object.keys(requestBody).length > 1) {
            return res
                .status(400)
                .send({ status: false, message: "invalid entry in request body" });
        }

        const urlCode = shortid.generate().toLowerCase()

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "URL is required" });
        }

        if (!isValidUrl(longUrl)) {
            return res
                .status(400)
                .send({ status: false, message: "Enter a valid URL" });
        }


        if (validUrl.isUri(longUrl)) {


            let url = await UrlModel.findOne({ longUrl })
            console.log(url)

            if (url) {
                const urlDataFromCache = await GET_ASYNC(url.urlCode)
                console.log("cache present")
                console.log(urlDataFromCache)
                return res.status(400).send({ status: false, message: `url already shortned as:-  ${url.shortUrl}` })
            } else {

                const shortUrl = baseUrl + '/' + urlCode
                const newurl = await UrlModel.create({ urlCode, longUrl, shortUrl })
                await newurl.save()
                const addingUrlDataInCache = SET_ASYNC(
                    urlCode,
                    longUrl
                )
                return res.status(201).send({ status: true, message: "url shortened ", data: newurl })
            }
        } else {
            return res.status(400).send('Invalid longUrl')
        }

    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
}


const getUrl = async function (req, res) {
    try {

        const requestBody = req.body;
        const queryParams = req.query;

        if (isValidRequest(queryParams)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid request" });
        }

        if (isValidRequest(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: " input data is not required" });
        }

        const urlCode = req.params.urlCode

        if (!/^(?=.*[a-zA-Z].*)[a-zA-Z\d!@#-_$%&*]{8,}$/.test(urlCode)) {
            return res
                .status(400)
                .send({ status: false, message: " enter a valid urlCode" });
        }

        const urlDataFromCache = await GET_ASYNC(urlCode);
        console.log("1st")
        console.log(urlDataFromCache)

        if (urlDataFromCache) {

            return res.status(302).redirect(urlDataFromCache);

        } else {


            const urlDataByUrlCode = await UrlModel.findOne({ urlCode });
            console.log("2nd")
            console.log(urlDataByUrlCode)

            if (!urlDataByUrlCode) {
                return res
                    .status(404)
                    .send({ status: false, message: "no such url exist" });
            }

            const addingUrlDataInCache = SET_ASYNC(
                urlCode,
                urlDataByUrlCode.longUrl
            );

            console.log("3rd")
            console.log(urlDataByUrlCode.longUrl)
            return res.status(302).redirect(urlDataByUrlCode.longUrl);


        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
}


module.exports = { createShortUrl, getUrl }
