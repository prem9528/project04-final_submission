const validUrl = require('valid-url')
const shortid = require('shortid')
const UrlModel = require("../models/urlmodel")
const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient(
    14645,
    "redis-14645.c212.ap-south-1-1.ec2.cloud.redislabs.com", { no_ready_check: true }
);

redisClient.auth("NLBmwO9GfmBfyDklW8eutoQSyWOENswG", function(err) {
    if (err) throw err;
});

redisClient.on("connect", async function() {
    console.log("connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);








const createShortUrl = async function (req, res) {
    try{    
        let longUrl = req.body.longUrl 

        let baseUrl = "localhost:3000"
    
    // if (!validUrl.isUri(baseUrl)) {
    //     return res.status(401).json('Invalid base URL')
    // }

    const urlCode = shortid.generate().toLowerCase()

    
    if (validUrl.isUri(longUrl)) {
        
           
            let url = await UrlModel.findOne({
                longUrl
            })
            console.log(url)

            
            if (url) {
                return res.status(400).send({status: false, message: "url present"})
            } else {
                
                const shortUrl = baseUrl + '/' + urlCode

                
                const newurl = await UrlModel.create({
                    urlCode,
                    longUrl,
                    shortUrl
                    
                })
                await newurl.save()
               return res.status(201).send({status: true, message: "url shortened ", data: newurl})
        }
        
        
    } else {
       return res.status(400).json('Invalid longUrl')
    }

}
catch (err) {
    res.status(500).send({ msg: err.message });
}
}


const getUrl =  async function (req, res) {
    try {

        const urlCode = req.params.urlCode
        
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


module.exports = {createShortUrl, getUrl}
