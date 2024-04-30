import express from "express";
import debug from "debug";
const debugBook = debug("app:book");
import {
  connect,
  ping,
  getBooks,
  getBookById,
  addBook,
  updateBookById,
  deleteBookById,
} from "../../database.js";
import { validId } from "../../middleware/validId.js";
import { validBody } from "../../middleware/validBody.js";
import Joi from "joi";
import { isLoggedIn, hasPermission } from "@merlin4/express-auth";

const router = express.Router();

const newBookSchema = Joi.object({
  bookID: Joi.number().integer().min(100).max(9999).required(),
  title: Joi.string().trim().min(1).required(),
  author: Joi.string().trim().min(1).required(),
  genre: Joi.string()
    .valid(
      "Fiction",
      "Magical Realism",
      "Dystopian",
      "Mystery",
      "Young Adult",
      "Non-Fiction",
      "NSFW"
    )
    .required(),
  publication_date: Joi.date().greater("01-01-1900").less("now").required(),
  page_count: Joi.number().integer().min(2).required(),
});

const updateBookSchema = Joi.object({
  bookID: Joi.number().integer().min(100).max(9999),
  title: Joi.string().trim().min(1),
  author: Joi.string().trim().min(1),
  genre: Joi.string().valid(
    "Fiction",
    "Magical Realism",
    "Dystopian",
    "Mystery",
    "Young Adult",
    "Non-Fiction",
    "NSFW"
  ),
  publication_date: Joi.date().greater("01-01-1900").less("now"),
  page_count: Joi.number().integer().min(2),
});

// Get all books (Because "list" could also be used as input we want to make sure we catch this before any parameters ":id")
router.get("/list", isLoggedIn(), async (req, res) => {
  //req.body -- Comes from the HTML form typically the name attribitue of the controls
  //<input type = "text" name="txtEmail"/>
  //req.body.txtEmail

  //req.params
  //Variable thats part of the URL
  //http://localhost:3003/api/books/1232323232
  //req.params.id

  //req.query
  //a query string is part of the url that starts with a ?
  debugBook(`The req.auth property is: ${JSON.stringify(req.auth)}`);

  let { keywords, author, title, genre, sortBy, pageSize, pageNumber } =
    req.query;
  const match = {}; //match stage of the aggregation pipeline is the filter similar to the where clause in SQL
  let sort = {
    author: 1,
  }; //default sort stage will sort by author ascending

  try {
    //debugBook(`Getting all the Books, The Query string is ${JSON.stringify(req.query)}`);

    if (keywords) {
      match.$text = {
        $search: keywords,
      };
    }

    if (author) {
      //match.author = { $eq: author };
      //debugBook(`If Author: ${author}`);
      match.author = {
        $regex: author,
      }; //Matches to Like with a partial word search
    }

    if (title) {
      //match.title = { $eq: title };
      //debugBook(`If Author: ${title}`);
      match.title = {
        $regex: title,
      }; //Matches to Like with a partial word search
    }

    if (genre) {
      //match.genre = { $eq: genre };
      match.genre = {
        $regex: genre,
      };
    }

    //debugBook(`The pipeline is ${JSON.stringify(sortBy)}`);

    switch (sortBy) {
      case "page_count":
        sort = {
          page_count: 1,
        };
        break;
      case "publication_date":
        sort = {
          publication_date: 1,
        };
        break;
    }

    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 100;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    //debugBook(`The pipeline is ${JSON.stringify(pipeline)}`);

    const db = await connect();
    const cursor = await db.collection("Book").aggregate(pipeline);
    const books = await cursor.toArray();

    res.status(200).json(books);
  } catch {
    res.status(500).json(err);
  }
});

//Add new book to the array/ Database
router.post(
  "/add",
  isLoggedIn(),
  validBody(newBookSchema),
  async (req, res) => {
    try {
      const newBook = req.body;
      const dbResult = await addBook(newBook);
      if (dbResult.acknowledged == true) {
        //debugBook({message: `Book ${newBook.title} added with an id of ${dbResult.insertedId}`});
        res.status(200).json({
          message: `Book ${newBook.title} added with an id of ${dbResult.insertedId}`,
        });
      } else {
        //debugBook({message: `Book ${newBook.title} not added`});
        res.status(400).json({
          message: `Book ${newBook.title} not added`,
        });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// Get book by ID
router.get("/:id", isLoggedIn(), validId("id"), async (req, res) => {
  try {
    const id = req.params.id;
    //debugBook(`In get a book by ID ${id}`);
    const book = await getBookById(id);
    if (book) {
      res.status(200).json(book);
    } else {
      res.status(400).json({
        error: ` Book with id : ${id} not found !`,
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update a book by the ID
//Update can use put or post
router.put(
  "/:id",
  validId("id"),
  isLoggedIn(),
  validBody(updateBookSchema),
  async (req, res) => {
    try {
      const id = req.params.id;
      const newBook = req.body;
      const ackRes = await updateBookById(id, newBook);
      debugBook(ackRes);
      if (ackRes.modifiedCount == 1) {
        res.status(200).json({
          message: `Book ${id} updated`,
        });
      } else {
        res.status(400).json({
          message: `Book ${id} not updated`,
        });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

//Delete a book by ID
router.delete("/:id", isLoggedIn(), validId("id"), async (req, res) => {
  try {
    const id = req.params.id;
    const ackRes = await deleteBookById(id);
    if ((ackRes.deletedCount == 1) & (ackRes.acknowledged == true)) {
      res.status(200).json({
        message: `Book ${id} Deleted succesfully !`,
      });
      //res.status(200).json(book);
    } else {
      res.status(400).json({
        message: `Book ${id} was not found !`,
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

export { router as BookRouter };
