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
  if (!req.body.customer_name) {
    return res.status(201).send({
      msg: "Customer can not be empty",
      err: true,
    });
  }

  var params = req.body;
  console.log(params);

  db.query(
    "INSERT INTO customer_part_linkage SET ? ",
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
});
router.post("/getAll", customerMiddleware.create, (req, res, next) => {
  let totalCount = 0;
  //parse int Convert String to number
  let startNum = req.body.page ? parseInt(req.body.page) : 1;
  let LimitNum = req.body.page_size ? parseInt(req.body.page_size) : 10;

  var query1 =
    "select count(*) as TotalCount from customer_part_linkage where markDelete=0";
  if (req.body.customer_name) {
    query1 +=
      " AND customer_name LIKE " +
      db.escape("%" + req.body.customer_name + "%");
  }
  if (req.body.part_no) {
    query1 += " AND part_no LIKE " + db.escape("%" + req.body.part_no + "%");
  }

  db.query(query1, function (error, results, fields) {
    if (error) {
      throw error;
      return res.status(201).send({
        msg: error,
        err: true
      });
    }
    totalCount = results[0].TotalCount;
  });

  var query = "select * from ?? where markDelete=0";
  if (req.body.customer_name) {
    query +=
      " AND customer_name LIKE " +
      db.escape("%" + req.body.customer_name + "%");
  }
  if (req.body.part_no) {
    query += " AND part_no LIKE " + db.escape("%" + req.body.part_no + "%");
  }
  query += " ORDER BY created_on DESC limit ? OFFSET ?";
  var table = ["customer_part_linkage", LimitNum, (startNum - 1) * LimitNum];

  query = mysql.format(query, table);
  console.log(query);

  db.query(query, function (error, results, fields) {
    if (error) {
      throw error;
      return res.status(201).send({
        msg: error,
        err: true
      });
    }
    return res.send({
      data: results,
      error: false,
      total_count: totalCount,
    });
  });
});
router.get("/getAllRecords", customerMiddleware.create, (req, res, next) => {
  db.query(
    "select * from customer_part_linkage where markDelete = 0",
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
        error: false,
      });
    }
  );
});
router.get("/getById/:id", customerMiddleware.create, (req, res, next) => {
  console.log(req.params.id);
  db.query(
    "select * from customer_part_linkage where id=?",
    [req.params.id],
    function (error, results, fields) {
    if (error) {
      throw error;
      return res.status(201).send({
        msg: error,
        err: true
      });
    }
      console.log(results);
      return res.send({
        data: results,
        error: false,
      });
    }
  );
});
router.get(
  "/getIndividualLinkage/:customer_id/:part_id",
  customerMiddleware.create,
  (req, res, next) => {
    console.log(req.params.id);
    db.query(
      "select * from customer_part_linkage where customer_id=? AND part_id=?",
      [req.params.customer_id, req.params.part_id],
      function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
        console.log(results);
        return res.send({
          data: results,
          error: false,
        });
      }
    );
  }
);
router.put("/update/:id", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Updating record: ", req.params.id);
  console.log("======================");
  if (!req.body.customer_name) {
    return res.status(201).send({
      msg: "Customer can not be empty",
      err: true,
    });
  }

  var params = req.body;
  console.log(params);
  const current = Date.now();
  db.query(
    "UPDATE `customer_part_linkage` SET `customer_name`=?,`customer_id`=?, `part_no`=?, `part_id`=?, `quantity`=?, `customer_part_no`=?, `barcode`=?, `duplicate_allow`=?, `status`=? where `id`=?",
    [
      req.body.customer_name,
      req.body.customer_id,
      req.body.part_no,
      req.body.part_id,
      req.body.quantity,
      req.body.customer_part_no,
      req.body.barcode,
      req.body.duplicate_allow,
      req.body.status,
      req.params.id,
    ],
    function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
      if (results) {
        db.query(
          `UPDATE customer_part_linkage SET updated_on = now() WHERE id = '${req.params.id}';`
        );
      }
      return res.status(200).send({
        data: results,
        msg: "Record has been updated successfully!",
        err: false,
      });
    }
  );
});
router.put("/temp-delete/:id", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Temporarily deleting record: ", req.params.id);
  console.log("======================");

  var params = req.body;
  console.log(params);
  const current = Date.now();
  db.query(
    "UPDATE `customer_part_linkage` SET `markDelete`=? where `id`=?",
    [1, req.params.id],
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
        msg: "Record has been marked as deleted successfully!",
        err: false,
      });
    }
  );
});
router.delete("/delete", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Deleting Record: ", req.body.id);
  console.log("======================");
  db.query(
    "DELETE FROM `customer_part_linkage` WHERE `id`=?",
    [req.body.id],
    function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
      return res.status(200).send({ err: false, msg: "Record has been deleted!" });
    }
  );
});
module.exports = router;
