import { MongoClient, ObjectId } from "mongodb";
import debug from "debug";
const debugDatabase = debug("app:Database");

let _db = null;

//const newId = (str) => new ObjectId(str);
const newId = (str) => ObjectId.createFromHexString(id);

async function connect() {
  if (!_db) {
    // Replace the placeholder with your Atlas connection string
    const connectionString =  process.env.DB_URL;
    const dbName = "DemoAmazon";
    const client = await MongoClient.connect(connectionString);
    _db = client.db(dbName);
  }
  return _db;
}

async function ping() {
  const db = await connect();
  await db.command({ ping: 1 });
  //console.log("Pinged your deployment. You successfully connected to MongoDB!");
  debugDatabase(
    `Pinged your deployment. You successfully connected to MongoDB!`
  );
}

async function getBooks() {
  const db = await connect();
  //find returns a cursor not the data itself
  const books = await db.collection("Book").find().toArray();
  //console.log(books);
  return books;
}


async function addBook(book) {
  const db = await connect();
  const result = await db.collection("Book").insertOne(book);
  //debugDatabase(result.insertedId);
  console.table(result);
  return result;
}

async function getBookById(id) {
  const db = await connect();
  const book = await db
    .collection("Book")
    .findOne({ _id: ObjectId.createFromHexString(id) });
  return book;
}

async function updateBookById(id, updatedBook) {
  const db = await connect();
  const result = await db
    .collection("Book")
    .updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { ...updatedBook } }
    );
  //console.table(result);
  debugDatabase(result);  
  return result;
}

async function deleteBookById(id) {
  const db = await connect();
  const result = await db
    .collection("Book")
    .deleteOne({ _id: ObjectId.createFromHexString(id) });
    debugDatabase(result);  
  return result;
}

//ping();

export { connect, ping, getBooks, getBookById, addBook, updateBookById ,deleteBookById };
