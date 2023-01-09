const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
var fs = require("fs");
const uuid = require("uuid");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const _ = require("lodash");
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

  db.query(`select *from planning ORDER BY id DESC LIMIT 1`, (err, result) => {
    var count = 0;
    let tempCount = 0;
    var oid = "";
    var today = moment().format("DDMMYY");
    var dateString = today;

    if (result && result.length) {
      var last_record_date = moment(result[0].created_on).format("DDMMYY");
      if (today === last_record_date) {
        dateString = last_record_date;
        count = result[0].order_no.slice(-4);
        tempCount = result[0].order_no.slice(-4);
      }
    }

    let tempReleaseCount = params.release_count;
    // let createdOrderIdsArr = [];
    delete params.release_count;
    for (i = 0; i < tempReleaseCount; i++) {
      tempCount++;
      oid = _.padStart(tempCount, 4, "0");
      var orderno = "QHT" + dateString + oid;

      const dateVal = new Date();
      const mm =
        dateVal.getMonth() < 10
          ? `0${dateVal.getMonth() + 1}`
          : dateVal.getMonth() + 1;

      const dd =
        dateVal.getDate() < 10 ? `0${dateVal.getDate()}` : dateVal.getDate();

      const seconds = dateVal.getSeconds();
      const minutes = dateVal.getMinutes();
      const hour = dateVal.getHours();

      const date = `${dd}/${mm}/${dateVal.getFullYear()} ${hour}:${minutes}:${seconds}`;

      // createdOrderIdsArr.push(order_no);
      var scanqty = 0;
      var boxqty = params.total_quantity;
      var partno = params.part_no;
      var customerpartno = params.customer_part_no;
      var partdesc = params.part_description;
      var customer = params.customer_name;
      var address = params.address;
      //var data = (`<output><orderinfo orderno=${id} /></output>`);
      var data =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        `<result type="build">` +
        `<orderinfo orderno="${orderno}"  date="${date}" scanqty="${scanqty}" boxqty="${boxqty}" />` +
        `<partinfo partno="${partno}" customerpartno="${customerpartno}"  partdesc="${partdesc}" />` +
        `<customerinfo customer="${customer}" address="${address}" />` +
        `<userInfo username="${req.body.login_user_name}" />` +
        "</result>";
      var secondsTimestamp = Date.now();
      fs.writeFile(
        `../../Application/Prints/${orderno}_${secondsTimestamp}.xml`,
        // `./sos-scanned-orders/${orderno}_${secondsTimestamp}.xml`,

        data,
        function (error) {
          if (error) {
            console.log(error);
            // res.status(401).send(error);
          } else {
            console.log("The file was saved!");
            // res.send("The file was saved");
          }
        }
      );
    }

    delete params.part_description;
    delete params.customer_part_no;
    delete params.address;

    // console.log("********* FInal OrdreIds====", createdOrderIdsArr);
    for (i = 0; i < tempReleaseCount; i++) {
      db.query(
        "INSERT INTO planning SET ? ",
        params,
        function (error, results, fields) {
          if (error) {
            throw error;
            return res.status(201).send({
              msg: error,
              err: true,
            });
          }
          //let uid = Date.now().toString(36);
          count++;
          oid = _.padStart(count, 4, "0");
          console.log(oid);
          var order_no = "QHT" + dateString + oid;
          // console.log("order array=", createdOrderIdsArr);
          console.log(order_no);
          if (results) {
            db.query(
              `UPDATE planning SET order_no = '${order_no}' WHERE id = '${results.insertId}';`
            );
          }
        }
      );
      if (i === parseInt(tempReleaseCount) - 1) {
        // console.log("Orders created ==", createdOrderIdsArr);

        return res.status(200).send({
          err: false,
          msg: "New record has been created successfully.",
          // data: createdOrderIdsArr,
        });
      }
    }
  });
});

router.post("/getAll", customerMiddleware.create, (req, res, next) => {
  let totalCount = 0;
  //parse int Convert String to number
  let startNum = req.body.page ? parseInt(req.body.page) : 1;
  let LimitNum = req.body.page_size ? parseInt(req.body.page_size) : 10;

  var query1 =
    "select count(*) as TotalCount from planning where markDelete=0 AND status!= 2";
  if (req.body.customer_name) {
    query1 +=
      " AND customer_name LIKE " +
      db.escape("%" + req.body.customer_name + "%");
  }
  if (req.body.part_no) {
    query1 += " AND part_no LIKE " + db.escape("%" + req.body.part_no + "%");
  }
  if (req.body.order_no) {
    query1 += " AND order_no LIKE " + db.escape("%" + req.body.order_no + "%");
  }

  db.query(query1, function (error, results, fields) {
    if (error) {
      throw error;
      return res.status(201).send({
        msg: error,
        err: true,
      });
    }
    totalCount = results[0].TotalCount;
  });

  var query = "select * from ?? where markDelete=0 AND status != 2";
  if (req.body.customer_name) {
    query +=
      " AND customer_name LIKE " +
      db.escape("%" + req.body.customer_name + "%");
  }
  if (req.body.part_no) {
    query += " AND part_no LIKE " + db.escape("%" + req.body.part_no + "%");
  }
  if (req.body.order_no) {
    query += " AND order_no LIKE " + db.escape("%" + req.body.order_no + "%");
  }
  query += " ORDER BY order_no DESC limit ? OFFSET ?";
  var table = ["planning", LimitNum, (startNum - 1) * LimitNum];

  query = mysql.format(query, table);
  console.log(query);

  db.query(query, function (error, results, fields) {
    if (error) {
      throw error;
      return res.status(201).send({
        msg: error,
        err: true,
      });
    }
    return res.status(200).send({
      data: results,
      error: false,
      total_count: totalCount,
    });
  });
});
router.get("/getAllRecords", customerMiddleware.create, (req, res, next) => {
  db.query(
    "select * from planning where markDelete = 0",
    function (error, results, fields) {
      if (error) {
        throw error;
        return res.status(201).send({
          msg: error,
          err: true,
        });
      }
      return res.status(200).send({
        data: results,
        error: false,
      });
    }
  );
});
router.get("/getById/:id", customerMiddleware.create, (req, res, next) => {
  console.log(req.params.id);
  db.query(
    "select * from planning where id=?",
    [req.params.id],
    function (error, results, fields) {
      if (error) {
        throw error;
        return res.status(201).send({
          msg: error,
          err: true,
        });
      }
      console.log(results);
      return res.status(200).send({
        data: results,
        error: false,
      });
    }
  );
});
router.get(
  "/getByOrderNo/:order_no",
  customerMiddleware.create,
  (req, res, next) => {
    console.log(req.params.order_no);
    db.query(
      "select * from planning where order_no=?",
      [req.params.order_no],
      function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true,
          });
        }
        console.log(results);
        return res.status(200).send({
          data: results,
          error: false,
        });
      }
    );
  }
);

router.put("/updateStatus/:id", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Updating record: ", req.params.id);
  console.log("======================");
  var params = req.body;
  console.log(params);
  const current = Date.now();
  db.query(
    "UPDATE `planning` SET `status`=? where `id`=?",
    [req.body.status, req.params.id],
    function (error, results, fields) {
      if (error) {
        throw error;
        return res.status(201).send({
          msg: error,
          err: true,
        });
      }
      if (results) {
        db.query(
          `UPDATE planning SET updated_on = now() WHERE id = '${req.params.id}';`
        );
      }
      return res.status(200).send({
        data: results,
        msg: "Status has been updated successfully!",
        err: false,
      });
    }
  );
});
router.put(
  "/updateQuantity/:id",
  customerMiddleware.create,
  (req, res, next) => {
    console.log("======================");
    console.log("Updating record: ", req.params.id);
    console.log("======================");
    var params = req.body;
    console.log(params);
    const current = Date.now();
    db.query(
      "UPDATE `planning` SET `scanned_quantity`=? where `id`=?",
      [req.body.scanned_quantity, req.params.id],
      function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true,
          });
        }
        if (results) {
          db.query(
            `UPDATE planning SET updated_on = now() WHERE id = '${req.params.id}';`
          );
        }
        return res.status(200).send({
          data: results,
          msg: "Quantity has been updated successfully!",
          err: false,
        });
      }
    );
  }
);
router.put("/temp-delete/:id", customerMiddleware.create, (req, res, next) => {
  console.log("======================");
  console.log("Temporarily deleting record: ", req.params.id);
  console.log("======================");

  var params = req.body;
  console.log(params);
  const current = Date.now();
  db.query(
    "UPDATE `planning` SET `markDelete`=? where `id`=?",
    [1, req.params.id],
    function (error, results, fields) {
      if (error) {
        throw error;
        return res.status(201).send({
          msg: error,
          err: true,
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
    "DELETE FROM `planning` WHERE `id`=?",
    [req.body.id],
    function (error, results, fields) {
      if (error) {
        throw error;
        return res.status(201).send({
          msg: error,
          err: true,
        });
      }
      return res
        .status(200)
        .send({ err: false, msg: "Record has been deleted!" });
    }
  );
});
module.exports = router;
