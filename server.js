import express from 'express';
import { BookRouter } from './routes/api/book.js';
import { UserRouter } from './routes/api/user.js';
import { connect, ping } from './database.js';
import * as dotenv from 'dotenv';
import debug from 'debug';
import cors from 'cors';
dotenv.config();

//Create a debug channel called app:server
const debugServer = debug('app:Server');

import cookieParser from 'cookie-parser';
import { authMiddleware } from '@merlin4/express-auth';
const app = express();

//middleware
//allow form data


app.use(express.static('public'));
app.use(express.json());//accepts json data in the body of the request from the client
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://hka-demo-amazon-frontend.wn.r.appspot.com',
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  authMiddleware(process.env.JWT_SECRET, 'authToken', {
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
  })
);
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use('/api/books', BookRouter);
app.use('/api/user', UserRouter);

app.use(express.static('public'));

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello world from Amazon.com !',
  });
  debugServer('Hello from the upgraded console.log()!');
});

//Error Handling middleware to handle routes not found
app.use((req, res) => {
  res.status(404).json({
    error: `Sorry Cannot find ${req.originalUrl} `,
  });
});

//Handle server exceptions to keep my server from crashing
app.use((err, req, res, next) => {
  debugServer(err.status, err.message);
  res.status(err.status).json({ error: err.message });
});

const port = process.env.PORT; //Get the Port from ENV

//Listen on Port 3003
app.listen(port, () => {
  debugServer(`Server is listening on http://localhost:${port} `);
});
