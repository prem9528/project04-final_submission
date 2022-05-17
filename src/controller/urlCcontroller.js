const validUrl = require('valid-url')
const shortid = require('shortid')
const Url = require("../models/urlmodel")


const createShortUrl = async function (req, res) {
    try{    
        let longUrl = req.body.longUrl 

        let baseUrl = "localhost:3000"
    
    if (!validUrl.isUri(baseUrl)) {
        return res.status(401).json('Invalid base URL')
    }

    const urlCode = shortid.generate()

    
    if (validUrl.isUri(longUrl)) {
        
           
            let url = await Url.findOne({
                longUrl
            })

            
            if (url) {
                return res.json(url)
            } else {
                
                const shortUrl = baseUrl + '/' + urlCode

                
                const newurl = await Url.create({
                    urlCode,
                    longUrl,
                    shortUrl
                    
                })
                await newurl.save()
                res.json(newurl)
        }
        
        
    } else {
        res.status(401).json('Invalid longUrl')
    }

}
catch (err) {
    console.log(err)
    res.status(500).json('Server Error')
} 
}
module.exports = {createShortUrl}