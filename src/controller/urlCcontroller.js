const validUrl = require('valid-url')
const shortid = require('shortid')
const UrlModel = require("../models/urlmodel")


const createShortUrl = async function (req, res) {
    try{    
        let longUrl = req.body.longUrl 

        let baseUrl = "localhost:3000"
    
    // if (!validUrl.isUri(baseUrl)) {
    //     return res.status(401).json('Invalid base URL')
    // }

    const urlCode = shortid.generate()

    
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
               return res.status(201).send(newurl)
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