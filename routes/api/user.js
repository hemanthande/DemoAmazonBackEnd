import express from "express";
import debug from "debug";
const debugUser = debug("app:user");
import { addUser, connect, getUsers, loginUser, ping } from "../../database.js";
//import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const router = express.Router();

// Get all users
router.get("/list", async (req, res) => {
  try {
    const db = await connect();
    const users = await getUsers();
    debugUser("Getting all the Users!");
    res.status(200).json(users);
  } catch {
    res.status(500).json(err);
  }
});

//Add new User to the Database
router.post("/add", async (req, res) => {
  try {
    const newUser = req.body;
    newUser.password = await bcrypt.hash(newUser.password, 10);
    const dbResult = await addUser(newUser);
    if (dbResult.acknowledged == true) {
      //debugUser({ message: `User ${newUser.userName} added with an id of ${dbResult.insertedId}`, });
      res.status(200).json({
        message: `User ${newUser.userName} added with an id of ${dbResult.insertedId}`,
      });
    } else {
      //debugUser({message: `Book ${newBook.title} not added`});
      res
        .status(400)
        .json({
          message: `There was an error creating this User : ${newUser.userName} `,
        });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/login", async (req, res) => {
  const user = req.body;
  try {
    const resultUser = await loginUser(user);
    debugUser(resultUser);
    if (
      resultUser &&
      (await bcrypt.compare(user.password, resultUser.password))
    ) {
      res.status(200).json({
        message: `Welcome ${resultUser.firstName} ${resultUser.lastName}`,
      });
    } else {
      res.status(401).json(`email or password incorrect`);
      //debugUser(resultUser);
    }
  } catch (err) {
    res.status(500).json(err);
    debugUser(err);
  }
});

export { router as UserRouter };
