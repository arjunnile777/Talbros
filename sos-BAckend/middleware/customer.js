const jwt = require("jsonwebtoken");
module.exports = {
  create: (req, res, next) => {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(
          token,
          'SECRETKEY'
        );
        req.userData = decoded;
        next();
      } catch (err) {
        return res.status(401).send({
          msg: 'Your session is not valid!'
        });
      }
  },
  getAll: (req, res, next) => {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(
          token,
          'SECRETKEY'
        );
        req.userData = decoded;
        next();
      } catch (err) {
        return res.status(401).send({
          msg: 'Your session is not valid!'
        });
      }
  },
  getById: (req, res, next) => {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(
          token,
          'SECRETKEY'
        );
        req.userData = decoded;
        next();
      } catch (err) {
        return res.status(401).send({
          msg: 'Your session is not valid!'
        });
      }
  },
};

