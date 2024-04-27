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
import { MongoClient } from "mongodb";

const router = express.Router();

// Get all books (Because "list" could also be used as input we want to make sure we catch this before any parameters ":id")
router.get("/list", async (req, res) => {
  try {
    const db = await connect();
    const books = await getBooks();
    debugBook("Getting all the Books!");
    res.status(200).json(books);
  } catch {
    res.status(500).json(err);
  }
});

//Add new book to the array/ Database
router.post("/add", async (req, res) => {
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
      res.status(400).json({ message: `Book ${newBook.title} not added` });
    }
  } catch (err) {
    res.status(500).json(err);
  }
  /*
  const newBook = req.body;
  if (newBook) {
    const bID = books.length + 1;
    newBook.bookID = bID;
    books.push(newBook);
    res.status(200).json({ message: `Book ID : ${bID} added` });
  } else {
    res.status(404).json({ message: `Book ID : ${bID} could not be added` });
  }
  */
});

// Get book by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    //debugBook(`In get a book by ID ${id}`);
    const book = await getBookById(id);
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json(err);
  }
  /* // This was original local array storage before updating to MongoDb cloud
  const bookID = req.params.id;
  const book = books.find((book) => book.bookID == bookID);
  if (book) {
    res.status(200).send(book);
  } else {
    res.status(404).json({ message: `Book ID : ${bookID} not found` });
  }
  */
  //res.json(books);
});

//Update a book by the ID
//Update can use put or post
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const newBook = req.body;
    const ackRes = await updateBookById(id, newBook);
    debugBook(ackRes);
    if (ackRes.modifiedCount == 1) {
      res.status(200).json({ message: `Book ${id} updated` });
    } else {
      res.status(400).json({ message: `Book ${id} not updated` });
    }
  } catch (err) {
    res.status(500).json(err);
  }
  /* //This Section was for Local JSON object before moving to database.
  const bookID = req.params.id;
  //for this line to work , you have to have a body parser
  const updatedBook = req.body;
  const currentBook = books.find((book) => book.bookID == bookID);

  if (currentBook) {
    for (const key in updatedBook) {
      if (currentBook[key] != updatedBook[key]) {
        currentBook[key] = updatedBook[key];
      }
    }
    //res.status(200).send(currentBook);
    //Save the Current Book back to the Array.
    const index = books.findIndex((book) => (book.bookID = bookID));
    if (index != 1) {
      books[index] = currentBook;
      res.status(200).json({ message: `Book ID : ${bookID} was updated` });
    }
  } else {
    res.status(404).json({ message: `Book ID : ${bookID} not found` });
  }
  res.json(updatedBook);
  */
});

//Delete a book by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const ackRes = await deleteBookById(id);
    if ((ackRes.deletedCount == 1) & (ackRes.acknowledged == true)) {
      res.status(200).json({ message: `Book ${id} Deleted succesfully !` });
      //res.status(200).json(book);
    } else {
      res.status(400).json({ message: `Book ${id} was not found !` });
    }
  } catch (err) {
    res.status(500).json(err);
  }
  /* This code was for deleting object from an array in local JSON object. we moved to Database storage.
  const bookID = req.params.id;
  const book = books.find((book) => book.bookID == bookID);
  if (book) {
    const delIndex = books.findIndex((book) => book.bookID == bookID);
    if (delIndex != 1) {
      books.splice(delIndex, 1);
      res.status(200).json({
        message: `Book ID : ${bookID} with Title : ${book.title} deleted Index ${delIndex}`,
      });
    }
  } else {
    res
      .status(200)
      .json({ message: `Book ID : ${bookID}  Not Found so cannot be deleted` });
  }

  res.status(200).json({
    message: `Book ID : ${bookID} Found ID ${book.bookID}   Title : ${book.title} `,
  });
  */
});

export { router as BookRouter };
