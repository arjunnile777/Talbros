const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const db = require("../lib/db.js");
const customerMiddleware = require("../middleware/customer.js");
router.post("/create", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Inserting new record");
  console.log("======================");
  // Validate request
  if (!req.body.barcode) {
    return res.status(201).send({
      msg: "Name can not be empty",
      err: true,
    });
  }
  if (!req.body.customer_id) {
    return res.status(201).send({
      msg: "Customer ID is required",
      err: true,
    });
  }
  if (!req.body.part_no) {
    return res.status(201).send({
      msg: "Part number is required",
      err: true,
    });
  }
  if (!req.body.order_no) {
    return res.status(201).send({
      msg: "Order number is required",
      err: true,
    });
  }

  let params = {};

  params.barcode = req.body.barcode;
  params.order_no = req.body.order_no;
  console.log(params);

  // db.query(
  //   "INSERT INTO client SET ? ",
  //   params,
  //   function (error, results, fields) {
  //     if (error) throw error;
  //     return res.send({
  //       data: results,
  //       error: false,
  //       message: "New record has been created successfully.",
  //     });
  //   }
  // );

  db.query(
    `SELECT * FROM client WHERE barcode = ${db.escape(req.body.barcode)}`,
    (err, result) => {
      console.log(result);
      if (result && result.length) {
        // duplicate_allow check is pending
        if (req.body.isduplicate === 1) {
          db.query(
            "INSERT INTO client SET ? ",
            params,
            function (error, results, fields) {
              if (error) {
                throw error;
                return res.status(201).send({
                  msg: error,
                  err: true
                });
              }
              return res.send({
                data: results,
                err: false,
                msg: "New record has been created successfully.",
              });
            }
          );
        } else {
          return res.status(201).send({
            msg: "Barcode does exist already.",
            err: true,
          });
        }
      } else {
        db.query(
          "INSERT INTO client SET ? ",
          params,
          function (error, results, fields) {
            if (error) {
              throw error;
              return res.status(201).send({
                msg: error,
                err: true
              });
            }
            return res.status(200).send({
              data: results,
              err: false,
              msg: "New record has been created successfully.",
            });
          }
        );
      }
    }
  );
});
router.get(
  "/getList/:order_no",
  customerMiddleware.create,
  (req, res, next) => {
    db.query(
      `select * from client where order_no = ${db.escape(req.params.order_no)}`,
      function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
        return res.status(200).send({
          data: results,
          error: false,
        });
      }
    );
  }
);
module.exports = router;
