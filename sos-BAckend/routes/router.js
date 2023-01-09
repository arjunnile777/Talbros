const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
const db = require("../lib/db.js");
const userMiddleware = require("../middleware/users.js");
var fs = require("fs");
router.post("/sign-up", userMiddleware.validateRegister, (req, res, next) => {
  db.query(
    `SELECT * FROM users WHERE LOWER(username) = LOWER(${db.escape(
      req.body.username
    )});`,
    (err, result) => {
      if (result && result.length) {
        return res.status(409).send({
          msg: "This username is already in use!",
        });
      } else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err,
            });
          } else {
            // has hashed pw => add to database
            db.query(
              `INSERT INTO users (id, username, password, registered) VALUES ('${uuid.v4()}', ${db.escape(
                req.body.username
              )}, ${db.escape(hash)}, now())`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    msg: err,
                  });
                }
                return res.status(201).send({
                  msg: "Registered!",
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post("/login", (req, res, next) => {
  db.query(
    `SELECT * FROM employee_master WHERE username = ${db.escape(
      req.body.username
    )};`,
    (err, result) => {
      // user does not exists
      if (err) {
        throw err;
        return res.status(400).send({
          msg: err,
        });
      }
      if (!result.length) {
        return res.status(400).send({
          msg: "Username or password is incorrect!",
        });
      }
      // check password
      if (req.body.password === result[0]["password"]) {
        const token = jwt.sign(
          {
            username: result[0].username,
            userId: result[0].id,
          },
          "SECRETKEY",
          {
            expiresIn: "7d",
          }
        );
        db.query(
          `UPDATE employee_master SET last_login = now() WHERE id = '${result[0].id}';`
        );
        return res.status(200).send({
          msg: "Logged in!",
          token,
          user: result[0],
        });
      } else {
        return res.status(400).send({
          msg: "Username or password is incorrect!",
        });
      }
      return res.status(401).send({
        msg: "Username or password is incorrect!",
      });
    }
  );
});

router.post("/save-scanned-order", function (req, res, next) {
  console.log("Raw XML: " + req.rawBody);
  console.log("Parsed XML: " + JSON.stringify(req.body));

  if (req.body) {
    var orderno = req.body.order_no;
    var date = req.body.date;
    var scanqty = req.body.scanned_qty;
    var boxqty = req.body.total_qty;
    var partno = req.body.part_no;
    var customerpartno = req.body.customer_part_no;
    var partdesc = req.body.part_description;
    var customer = req.body.customer;
    var address = req.body.address;
    //var data = (`<output><orderinfo orderno=${id} /></output>`);
    var data =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      `<result type="${req.body.type}">` +
      `<orderinfo orderno="${orderno}"  date="${date}" scanqty="${scanqty}" boxqty="${boxqty}" />` +
      `<partinfo partno="${partno}" customerpartno="${customerpartno}"  partdesc="${partdesc}" />` +
      `<customerinfo customer="${customer}" address="${address}" />` +
      `<userInfo username="${req.body.login_user_name}" />` +
      "</result>";
    var secondsTimestamp = new Date().getTime() / 1000;
    fs.writeFile(
      `../../Application/Prints/${orderno}_${secondsTimestamp}.xml`,
      // `./sos-scanned-orders/${orderno}_${secondsTimestamp}.xml`,
      data,
      function (error) {
        if (error) {
          console.log(error);
          res.status(401).send(error);
        } else {
          console.log("The file was saved!");
          res.send("The file was saved");
        }
      }
    );
  } else {
    res.status(401).send("Unexpected XML received, missing data");
  }
});

router.get("/secret-route", userMiddleware.isLoggedIn, (req, res, next) => {
  res.send("This is the secret content. Only logged in users can see that!");
});
module.exports = router;
