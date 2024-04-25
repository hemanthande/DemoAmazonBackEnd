import express from "express";
import debug from 'debug';
const debugBook = debug('app:book');

const router = express.Router();

const books = [
  {
    bookID: 446,
    title: "Torrente 5: Operación Eurovegas",
    author: "Nolie Bancroft",
    publication_date: "3/26/1955",
    genre: "fiction",
    page_count: 247,
  },
  {
    bookID: 888,
    title: "Finisterrae",
    author: "Madel Lottrington",
    publication_date: "1/4/1907",
    genre: "mystery",
    page_count: 704,
  },
  {
    bookID: 687,
    title: "Children of the Night",
    author: "Astra Prator",
    publication_date: "3/23/1950",
    genre: "romance",
    page_count: 458,
  },
  {
    bookID: 819,
    title: "Six in Paris (Paris vu par...)",
    author: "Dillon Buss",
    publication_date: "4/16/1986",
    genre: "mystery",
    page_count: 178,
  },
  {
    bookID: 200,
    title: "Club Fed",
    author: "Rivkah Bashford",
    publication_date: "12/30/1961",
    genre: "non-fiction",
    page_count: 457,
  },
  {
    bookID: 850,
    title: "Paris by Night",
    author: "Hillary Sewall",
    publication_date: "5/18/1964",
    genre: "non-fiction",
    page_count: 992,
  },
  {
    bookID: 951,
    title: "Rumble Fish",
    author: "Marika Linzee",
    publication_date: "1/30/1929",
    genre: "romance",
    page_count: 757,
  },
  {
    bookID: 64,
    title: "Mr. Troop Mom",
    author: "Oralia Allder",
    publication_date: "3/24/2012",
    genre: "romance",
    page_count: 301,
  },
  {
    bookID: 726,
    title: "Abelar: Tales of an Ancient Empire (Tales of an Ancient Empire)",
    author: "Cheslie Casellas",
    publication_date: "7/12/1965",
    genre: "fiction",
    page_count: 375,
  },
  {
    bookID: 384,
    title: "Navy Seals",
    author: "Aldus Daykin",
    publication_date: "1/8/1986",
    genre: "mystery",
    page_count: 370,
  },
  {
    bookID: 262,
    title: "America's Most Haunted Inns",
    author: "Tait Pendergrast",
    publication_date: "8/6/1958",
    genre: "mystery",
    page_count: 127,
  },
  {
    bookID: 888,
    title: "Merchant of Venice, The",
    author: "Tabb Shasnan",
    publication_date: "5/8/1931",
    genre: "mystery",
    page_count: 707,
  },
  {
    bookID: 180,
    title: "Officer and a Gentleman, An",
    author: "Hendrik Norcop",
    publication_date: "5/12/1928",
    genre: "non-fiction",
    page_count: 762,
  },
  {
    bookID: 441,
    title: "Harder They Fall, The",
    author: "Illa Fettes",
    publication_date: "5/1/1974",
    genre: "mystery",
    page_count: 702,
  },
  {
    bookID: 49,
    title: "Superweib, Das",
    author: "Eduino Osbourne",
    publication_date: "9/28/1950",
    genre: "sci-fi",
    page_count: 471,
  },
  {
    bookID: 115,
    title: "Scarecrow",
    author: "Joela Meynell",
    publication_date: "2/24/1927",
    genre: "non-fiction",
    page_count: 266,
  },
  {
    bookID: 438,
    title: "Gui Si (Silk)",
    author: "Agneta Canto",
    publication_date: "5/20/1929",
    genre: "fiction",
    page_count: 109,
  },
  {
    bookID: 258,
    title:
      "Playing 'In the Company of Men' (En jouant 'Dans la compagnie des hommes')",
    author: "Casi Stot",
    publication_date: "4/24/1937",
    genre: "mystery",
    page_count: 638,
  },
  {
    bookID: 798,
    title: "Karen Cries on the Bus",
    author: "Harriot Gerner",
    publication_date: "8/6/1945",
    genre: "romance",
    page_count: 837,
  },
  {
    bookID: 976,
    title: "Harry in Your Pocket",
    author: "Fax Beilby",
    publication_date: "4/28/1978",
    genre: "sci-fi",
    page_count: 946,
  },
];

// Get all books
router.get("/list", (req, res) => {
  debugBook('Getting all the Books!');
  res.status(200).json(books);
});

// Get a book by ID
router.get("/:id", (req, res) => {
  const bookID = req.params.id;
  const book = books.find((book) => book.bookID == bookID);
  if (book) {
    res.status(200).send(book);
  } else {
    res.status(404).json({ message: `Book ID : ${bookID} not found` });
  }

  //res.json(books);
});

//Update a book by the ID
//Update can use put or post
router.put("/:id", (req, res) => {
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
});

//Add new book to the array
router.post("/add", (req, res) => {
  const newBook = req.body;

  if (newBook) {
    const bID = books.length + 1;
    newBook.bookID = bID;
    books.push(newBook);
    res.status(200).json({ message: `Book ID : ${bID} added` });
  } else {
    res.status(404).json({ message: `Book ID : ${bID} could not be added` });
  }
});

//Delete a book by ID
router.delete("/:id", (req, res) => {
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
});

export { router as BookRouter };
