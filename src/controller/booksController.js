const mongoose = require('mongoose');
const userModel = require("../models/userModel");
const bookModel = require('../models/booksModel');
const reviewModel = require('../models/reviewModel');


const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length > 0) return true;
};
const isValidRequestBody = function (object) {
    return Object.keys(object).length > 0;
};
const isValidIdType = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};
const isValidSubcategory = function (value) {
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length > 0) return true;
    if (typeof value == "object" && Array.isArray(value) == true) return true;
};



const createBook = async function (req, res) {
    try {
        const book = req.body;
        // book["userId"] = req.userId;
        let requestedUserId = req.userId;
        let bodyUser = book.userId;
        if (requestedUserId !== bodyUser) {
            return res.status(401).send({ status: false, msg: "authorisation failed" });
        }

        const saved = await bookModel.create(book);
        res.status(201).send({ status: true, msg: "Book is created successfully.", data: saved });
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
};



const booksList = async function (req, res) {
    try {
        const requestBody = req.body;
        if (isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "content from body not required" });
            return
        }

        const queryParams = req.query;
        const filterConditions = { isDeleted: false, deletedAt: null };
        if (isValidRequestBody(queryParams)) {
            const { userId, category, subcategory } = queryParams;

            if (queryParams.hasOwnProperty("userId")) {
                if (isValid(userId) && isValidIdType(userId)) {
                    const userById = await userModel.findById(userId);
                    if (userById) {
                        filterConditions["userId"] = userId.trim();
                    } else {
                        res.status(404).send({ status: false, message: `no user present by Id ${userId}` });
                        return
                    }
                } else {
                    res.status(400).send({ status: false, message: "enter a valid userId" });
                    return
                }
            }

            if (queryParams.hasOwnProperty("category")) {
                if (isValid(category)) {
                    filterConditions["category"] = category.trim();
                } else {
                    res.status(400).send({ status: false, message: `format for category is incorrect` });
                    return
                }
            }

            if (queryParams.hasOwnProperty("subcategory")) {
                if (isValidSubcategory(subcategory)) {
                    filterConditions["subcategory"] = subcategory;

                } else {
                    res.status(400).send({ status: false, message: `format for subcategory is incorrect`, });
                    return
                }
            }

            const filteredBookList = await bookModel.find(filterConditions).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, subcategory: 1, releasedAt: 1, reviews: 1, }).sort({ title: 1 });
            if (filteredBookList.length == 0) {
                res.status(404).send({ status: false, message: "no books entry present" });
                return
            }

            res.status(200).send({ status: true, message: "filtered books enteries are here", booksCount: filteredBookList.length, bookList: filteredBookList, });
        }
        else {
            const bookList = await bookModel.find(filterConditions).select({ _id: 1, title: 1, userId: 1, category: 1, subcategory: 1, releasedAt: 1, reviews: 1, }).sort({ title: 1 });
            if (bookList.length == 0) {
                res.status(404).send({ status: false, message: "no books found" });
                return
            }

            res.status(200).send({ status: true, message: "Book list is here", booksCount: bookList.length, bookList: bookList, });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};


const getbookId = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (bookId.length < 24 || bookId.length > 24) {
            return res.status(400).send({ status: false, msg: "Plz Enter Valid Length Of BookId in Params" });
        }

        let bData = await bookModel.findById(bookId);
        if (!bData) {
            return res.status(404).send({ status: false, message: "Data Not Found" });
        }

        let reviewid = await reviewModel.find({ bookId: bookId }).select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 });
        
        Object.assign(bData._doc, { reviewsData: reviewid });
        res.status(200).send({ status: true, message: "Books list", data: bData });
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
};




const updatebook = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (bookId.length < 24 || bookId.length > 24) {
            return res.status(400).send({ status: false, msg: "Plz Enter Valid Length Of BookId in Params" });
        }

        let body = req.body;
        const filterConditions = { isDeleted: false, deletedAt: null };

        if (isValidRequestBody(body)) {
            const { title, excerpt, ISBN, releasedAt } = body;

            if (body.hasOwnProperty("title")) {
                if (isValid(title)) {
                    filterConditions["title"] = title.trim();
                } else {
                    res.status(400).send({ status: false, message: "enter a valid title" });
                    return
                }
            }

            if (body.hasOwnProperty("excerpt")) {
                if (isValid(excerpt)) {
                    filterConditions["excerpt"] = excerpt.trim();
                } else {
                    res.status(400).send({ status: false, message: `format for excerpt is incorrect` });
                    return
                }
            }

            if (body.hasOwnProperty("releasedAt")) {
                if (isValid(releasedAt)) {
                    filterConditions["releasedAt"] = releasedAt;

                } else {
                    res.status(400).send({ status: false, message: `format for releasedAt is incorrect`, });
                    return
                }
            }
            if (body.hasOwnProperty("ISBN")) {
                if (isValid(ISBN)) {
                    filterConditions["ISBN"] = ISBN.trim();

                } else {
                    res.status(400).send({ status: false, message: `format for ISBN is incorrect`, });
                    return
                }
            }
            const updatedBook = await bookModel.findByIdAndUpdate({ _id: bookId }, { $set: filterConditions }, { new: true });
            res.status(200).send({ status: true, message: "Blog successfully updated", data: updatedBook })
        } else {
            res.status(400).send({ status: false, msg: "Plz Enter Data In Body" });
        }
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
};


const deleteBooks = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        if (bookId.length < 24 || bookId.length > 24) {
            return res.status(400).send({ status: false, msg: "Plz Enter Valid Length Of BookId in Params" });
        }

        const IsValidBookId = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!IsValidBookId) {
            return res.status(404).send({ status: false, msg: "No book found." });
        }

        if (IsValidBookId.userId != req.userId) {        //validating that the userId from body is similar to the token
            return res.status(401).send({ status: false, message: "Unauthorized access." });
        }

        const deletedDetails = await bookModel.findOneAndUpdate({ _id: bookId }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        res.status(201).send({ status: true, msg: "Book deleted successfully", data: deletedDetails });
    }
    catch (err) {
        res.status(500).send({ msg: err.message });
    }
};



module.exports = { createBook, getbookId, booksList, updatebook, deleteBooks };
