import { MongoClient, ObjectId } from "mongodb";
import debug from "debug";
import { json } from "express";
const debugDatabase = debug("app:Database");

let _db = null;

//const newId = (str) => new ObjectId(str);
const newId = (str) => ObjectId.createFromHexString(str);

async function connect() {
  if (!_db) {
    const connectionString = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(connectionString);
    _db = client.db(dbName);
  }
  return _db;
}

async function ping() {
  const db = await connect();
  await db.command({
    ping: 1,
  });
  debugDatabase( `Pinged your deployment. You successfully connected to MongoDB!` );
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
  //debugDatabase(result.acknowledged);
  return result;
}

async function getBookById(id) {
  const db = await connect();
  const book = await db.collection("Book").findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return book;
}

async function updateBookById(id, updatedBook) {
  const db = await connect();
  const result = await db.collection("Book").updateOne(
    {
      _id: ObjectId.createFromHexString(id),
    },
    {
      $set: {
        ...updatedBook,
      },
    }
  );
  //console.table(result);
  //debugDatabase(result);
  return result;
}

async function deleteBookById(id) {
  const db = await connect();
  const result = await db.collection("Book").deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  debugDatabase(result);
  return result;
}

async function addUser(user) {
  const db = await connect();
  user.role = ["customer"]; // Adding a default role for every user.
  //Before adding check if the email/username is already taken.
  //debugDatabase(user);
  const potentialDup = await db
    .collection("User")
    .findOne({ email: user.email });
  if (potentialDup) {
    debugDatabase("Duplicate exist cannot insert");
    return null;
  } else {
    debugDatabase("Inserted");
    const result = await db.collection("User").insertOne(user);
    debugDatabase(result.insertedId);
    return result;
  }
}

async function loginUser(user) {
  const db = await connect();
  //  debugDatabase(user);
  const resultUser = await db.collection("User").findOne({
    email: user.email,
  });
  //debugDatabase(resultUser);
  return resultUser;
}

async function getUsers() {
  const db = await connect();
  const users = await db.collection("User").find().toArray();
  return users;
}

async function getUserById(id) {
  const db = await connect();
  const user = await db.collection("User").findOne({
    _id: id,
  });
  return user;
}

async function updateUser(user) {
  const db = await connect();
  const result = await db
    .collection("User")
    .updateOne({ _id: user._id }, { $set: { ...user } });
  return result;
}

async function saveEdit(edit) {
  const db = await connect();
  const result = await db.collection("Edit").insertOne(edit);
  return result;
}

async function findRoleByName(name) {
  const db = await connect();
  const role = await db.collection("Role").findOne({
    name: name,
  });
  return role;
}

ping();

export {
  connect,
  ping,
  getBooks,
  getBookById,
  addBook,
  updateBookById,
  deleteBookById,
  getUsers,
  getUserById,
  addUser,
  loginUser,
  newId,
  updateUser,
  saveEdit,
  findRoleByName,
};
//export {findRoleByName,connect, ping, getBooks, getBookById, addBook, updateBook, deleteBook, addUser, loginUser, newId,getAllUsers, getUserById, updateUser, saveEdit}
