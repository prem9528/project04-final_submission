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
               return res.status(201).send({status: true, message: "url shortened ", data: newurl})
        }
        
        
    } else {
        res.status(400).json('Invalid longUrl')
    }

}
catch (err) {
    res.status(500).send({ msg: err.message });
}
}


const getUrl =  async function (req, res) {
    try {
       
        let isUrlPresent = await UrlModel.findOne({
            urlCode: req.params.urlCode
        })
        if (isUrlPresent) {
            
            return res.status(200).redirect(isUrlPresent.longUrl)
        } else {
            
            return res.status(404).json({status: false, message: 'No URL Found'})
        }

    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
}


module.exports = {createShortUrl, getUrl}