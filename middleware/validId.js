import { ObjectId } from "mongodb";

const validId = (paramName) => {
  return (req, res, next) => {
    try {
      //req[paramName] = new ObjectId(req.params[paramName]);
      req[paramName] = ObjectId.createFromHexString(req.params[paramName]);
      return next();
    } catch (err) {
      return res .status(400).json({ error: `${paramName}  is not valid ObjectId` });
    }
  };
};

export { validId };
