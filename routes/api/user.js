import express from "express";
import debug from "debug";
const debugUser = debug("app:user");
import {
    addUser,
    connect,
    getUsers,
    loginUser,
    ping
} from "../../database.js";
//import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import {
    validBody
} from "../../middleware/validBody.js";
import Joi from 'joi';

const router = express.Router();

//step 1: define new user schema
const newUserSchema = Joi.object({
    name: Joi.string().trim().min(1).max(50).required(),
    password: Joi.string().trim().min(8).max(50).required(),
    email: Joi.string().trim().email().required()
});

const loginUserSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(8).max(50).required()
});


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
router.post("/add", validBody(newUserSchema), async (req, res) => {
    try {
        const newUser = req.body;
        newUser.password = await bcrypt.hash(newUser.password, 10);
        const dbResult = await addUser(newUser);
        if (dbResult.acknowledged == true) {
            //debugUser({ message: `User ${newUser.userName} added with an id of ${dbResult.insertedId}`, });
            res.status(200).json({
                message: `User ${newUser.name} added with an id of ${dbResult.insertedId}`,
            });
        } else {
            //debugUser({message: `Book ${newBook.title} not added`});
            res
                .status(400)
                .json({
                    message: `There was an error creating this User : ${newUser.name} `,
                });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post("/login", validBody(loginUserSchema), async (req, res) => {
    const user = req.body;
    try {
        const resultUser = await loginUser(user);
        debugUser(resultUser);
        if (
            resultUser &&
            (await bcrypt.compare(user.password, resultUser.password))
        ) {
            res.status(200).json({
                message: `Welcome ${resultUser.name}`,
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

export {
    router as UserRouter
};