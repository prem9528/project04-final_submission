const validUrl = require('valid-url')
const shortid = require('shortid')
const UrlModel = require("../models/urlmodel")
const redis = require("redis");
const { promisify } = require("util");

//***********************************CONNECT TO REDIS********************************************** */
const redisClient = redis.createClient(
    15377,
    "redis-15377.c301.ap-south-1-1.ec2.cloud.redislabs.com", { no_ready_check: true }
);

redisClient.auth("2flRShscfKxE7AEYMYbaVNdA0zeTK38t", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



//*************************************LOGIC CODE************************************************ */

const createShortUrl = async function (req, res) {
    try {
        const requestBody = req.body;
        let longUrl = req.body.longUrl
        let baseUrl = "localhost:3000"
        const urlCode = shortid.generate().toLowerCase()

        if (longUrl) {
            longUrl = longUrl.trim()
            if (!(longUrl.includes('//'))) {
                return res.status(400).send({ status: false, msg: "Invalid longUrl" })
            }
            const urlParts = longUrl.split('//')
            const scheme = urlParts[0]
            const uri = urlParts[1]
            let shortenedUrlDetails
            if (!(uri.includes('.'))) {
                return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
            }
            const uriParts = uri.split('.')
            if (!(((scheme == "http:") || (scheme == "https:")) && (uriParts[0].trim().length) && (uriParts[1].trim().length))) {
                return res.status(400).send({ status: false, msg: "Invalid longUrl" })
            }
            shortenedUrlDetails = await UrlModel.findOne({ longUrl })
            if (shortenedUrlDetails) {
                res.status(400).send({ status: true, msg: "url is already shortned ", data: shortenedUrlDetails })
            } else {
                const shortUrl = baseUrl + '/' + urlCode.toLowerCase()
                shortenedUrlDetails = await UrlModel.create({ urlCode, longUrl, shortUrl })
                await SET_ASYNC(urlCode.toLowerCase(),
                    longUrl)
                res.status(201).send({ status: true.valueOf, data: shortenedUrlDetails })
            }


        } else {
            res.status(401).send({ status: false, msg: 'longUrl must be present in the body' })
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

        if (queryParams.length > 0) {
            return res
                .status(400)
                .send({ status: false, message: "invalid request" });
        }

        if (Object.keys(requestBody).length != 0) {
            return res
                .status(400)
                .send({ status: false, message: " input data is not required" });
        }

        const urlCode = req.params.urlCode.trim()

        if (!/^(?=.*[a-zA-Z].*)[a-zA-Z\d!@#-_$%&*]{8,}$/.test(urlCode)) {
            return res
                .status(400)
                .send({ status: false, message: " enter a valid urlCode" });
        }

        const urlDataFromCache = await GET_ASYNC(urlCode);


        if (urlDataFromCache) {

            return res.status(302).redirect(urlDataFromCache);

        } else {


            const urlDataByUrlCode = await UrlModel.findOne({ urlCode });

            if (!urlDataByUrlCode) {
                return res
                    .status(404)
                    .send({ status: false, message: "no such url exist" });
            }

            const addingUrlDataInCache = SET_ASYNC(
                urlCode,
                urlDataByUrlCode.longUrl
            );
            return res.status(302).redirect(urlDataByUrlCode.longUrl);


        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
}


module.exports = { createShortUrl, getUrl }
