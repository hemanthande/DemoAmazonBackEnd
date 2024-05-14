import express from 'express';
import debug from 'debug';
const debugUser = debug('app:user');
import {
  addUser,
  connect,
  getUsers,
  getUserById,
  loginUser,
  saveEdit,
  updateUser,
  newId,
  findRoleByName,
} from '../../database.js';
//import { MongoClient } from "mongodb";
import bcrypt from 'bcrypt';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import {
  isLoggedIn,
  fetchRoles,
  mergePermissions,
  hasPermission,
} from '@merlin4/express-auth';
import { validId } from '../../middleware/validId.js';

const router = express.Router();
async function issueAuthToken(user) {
  const payload = { _id: user._id, email: user.email, role: user.role };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  const roles = await fetchRoles(user, (role) => findRoleByName(role));

  roles.forEach((role) => {
    debugUser(
      `The users role is ${
        role.name
      } and has the following permissions: ${JSON.stringify(role.permissions)}`
    );
  });

  const permissions = mergePermissions(user, roles);
  payload.permissions = permissions;

  //debugUser(`The users permissions are ${permissions}`);

  const authToken = jwt.sign(payload, secret, options);
  return authToken;
}

function issueAuthCookie(res, authToken) {
  const cookieOptions = { httpOnly: true, maxAge: 1000 * 60 * 60 };
  res.cookie('authToken', authToken, cookieOptions);
}

//step 1: define new user schema
const newUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  password: Joi.string().trim().min(8).max(50).required(),
  email: Joi.string().trim().email().required(),
});

const loginUserSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(8).max(50).required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50),
  password: Joi.string().trim().min(8).max(50),
});

// Get all users
router.get('/list', isLoggedIn(), async (req, res) => {
  try {
    const db = await connect();
    const users = await getUsers();
    debugUser('Getting all the Users!');
    res.status(200).json(users);
  } catch (err) {
    debugUser(err.error);
    res.status(500).json({ error: err.message });
  }
});

//Add new User to the Database
router.post('/add', validBody(newUserSchema), async (req, res) => {
  try {
    const newUser = {
      //_id: newId(),
      ...req.body,
      createdDate: new Date(),
    };

    newUser.password = await bcrypt.hash(newUser.password, 10);
    const dbResult = await addUser(newUser);
    debugUser(dbResult);
    if (dbResult.acknowledged == true) {
      debugUser({
        message: `User ${newUser.name} added with an id of ${dbResult.insertedId}`,
      });
      //creating Cookies and issuing AuthToken
      const authToken = await issueAuthToken(newUser);
      issueAuthCookie(res, authToken);

      res.status(200).json({
        message: `New user ${newUser.name} added`,
        fullName: newUser.name,
        role: newUser.role,
      });
    } else {
      res.status(400).json({
        message: `There was an error creating this User : ${newUser.name} or $ ${newUser.email} `,
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//Login
router.post('/login', validBody(loginUserSchema), async (req, res) => {
  const user = req.body;

  const resultUser = await loginUser(user);
  //debugUser(resultUser);
  if (
    resultUser &&
    (await bcrypt.compare(user.password, resultUser.password))
  ) {
    const authToken = await issueAuthToken(resultUser);
    issueAuthCookie(res, authToken);
    res.status(200).json({
      message: `Welcome ${resultUser.name}`,
      authToken: authToken,
      email: resultUser.email,
      name: resultUser.name,
      role: resultUser.role,
    });
  } else {
    res.status(401).json(`email or password incorrect`);
  }
});

router.post('/logout', isLoggedIn(), async (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({ message: 'Logged Out' });
});

//Self Service Update
router.put(
  '/update/me',
  isLoggedIn(),
  validBody(updateUserSchema),
  async (req, res) => {
    debugUser(`Self Service Route Updating a user ${JSON.stringify(req.auth)}`);
    //debugUser(`updateUserSchema :${JSON.stringify(updateUserSchema)}`);
    const updatedUser = req.body;

    try {
      const user = await getUserById(newId(req.auth._id));
      if (user) {
        if (updatedUser.name) {
          user.name = updatedUser.name;
        }
        if (updatedUser.password) {
          user.password = await bcrypt.hash(updatedUser.password, 10);
        }
        const dbResult = await updateUser(user);
        if (dbResult.modifiedCount == 1) {
          const edit = {
            timeStamp: new Date(),
            op: 'Self-Edit Update User',
            collection: 'User',
            target: user._id,
            auth: req.auth,
          };
          await saveEdit(edit);
          res.status(200).json({ message: `User ${req.auth._id} updated` });
          return;
        } else {
          res.status(400).json({ message: `User ${req.auth._id} not updated` });
          return;
        }
      } else {
        res.status(400).json({ message: `User ${req.auth._id} not updated` });
      }
    } catch (err) {
      res.status(500).json({ error: err.stack });
    }
  }
);

//Admin can update a user by the id
router.put(
  '/update/:id',
  isLoggedIn(),
  validId('id'),
  validBody(updateUserSchema),
  async (req, res) => {
    debugUser('Admin Route Updating a user');
    debugUser(req.body);
    //const id = req.params.id;
    const updatedUser = req.body;
    const user = await getUserById(req.id);
    //update user with updatedUser
    debugUser(updatedUser);
    if (user) {
      if (updatedUser.name) {
        user.name = updatedUser.name;
      }
      if (updatedUser.password) {
        user.password = await bcrypt.hash(updatedUser.password, 10);
      }
      const dbResult = await updateUser(user);
      if (dbResult.modifiedCount == 1) {
        const edit = {
          timeStamp: new Date(),
          op: 'Admin Update User',
          collection: 'User',
          target: user._id,
          auth: req.auth,
        };
        await saveEdit(edit);
        res.status(200).json({ message: `User ${req.id} updated` });
        return;
      } else {
        res.status(400).json({ message: `User ${req.id} not updated` });
        return;
      }
    } else {
      res.status(400).json({ message: `User ${req.id} not updated` });
    }
  }
);

export { router as UserRouter };
