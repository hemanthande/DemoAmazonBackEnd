import express from "express";
import { BookRouter } from "./routes/api/book.js";
import { connect, ping } from "./database.js";
import * as dotenv from "dotenv";
import debug from "debug";
dotenv.config();

//Create a debug channel called app:server
const debugServer = debug("app:Server");

const app = express();

//middleware
//allow form data
app.use(express.urlencoded({ extended: true }));
app.use("/api/books", BookRouter);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world from Amazon.com !" });
  debugServer("Hello from the upgraded console.log()!");
});

//Error Handling middleware to handle routes not found
app.use((req, res) => {
  res.status(404).json({ error: `Sorry Cannot find ${req.originalUrl} ` });
});

//Handle server exceptions to keep my server from crashing
app.use((err, req, res, next) => {
  debugServer(err.stack);
  res.status(500).json({ error: err.stack });
});

const port = process.env.PORT || 3005;

//Listen on Port 3003
app.listen(port, () => {
  debugServer(`Server is listening on http://localhost:${port} `);
});
