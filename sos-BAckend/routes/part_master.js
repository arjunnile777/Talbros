const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const db = require('../lib/db.js');
const customerMiddleware = require('../middleware/customer.js');
router.post('/create', customerMiddleware.create, (req, res, next) => {
    console.log("======================")
    console.log("Inserting new record")
    console.log("======================")
    // Validate request
    if (!req.body.part_no) {
        return res.status(201).send({
            msg: "Part Number can not be empty",
            err: true
        });
    }

    var params = req.body;
    console.log(params);

    db.query("INSERT INTO part_master SET ? ", params,
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
                msg: 'New record has been created successfully.'
            });
    });

});
router.post('/getAll', customerMiddleware.create, (req, res, next) => {
    let totalCount = 0;
    //parse int Convert String to number
    let startNum = req.body.page ? parseInt(req.body.page) : 1;
    let LimitNum = req.body.page_size ? parseInt(req.body.page_size) : 10;

    var query1 = 'select count(*) as TotalCount from part_master where markDelete=0';
    if(req.body.part_no) {
        query1 += ' AND part_no LIKE '+ db.escape('%'+req.body.part_no+'%');
    }
    db.query(query1,
    function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
        totalCount = results[0].TotalCount;

    });

    var query = 'select * from ?? where markDelete=0';
    if(req.body.part_no) {
        query += ' AND part_no LIKE '+ db.escape('%'+req.body.part_no+'%');
    }
    query += ' ORDER BY created_on DESC limit ? OFFSET ?';
    var table = ["part_master",LimitNum,(startNum - 1)*LimitNum];

    query = mysql.format(query, table);
    console.log(query);

    db.query(query,
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
            total_count: totalCount
        });

    });

});
router.get('/getById/:id', customerMiddleware.create, (req, res, next) => {
    console.log(req.params.id)
    db.query('select * from part_master where id=?',
    [req.params.id],
    function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
        console.log(results)
        return res.send({
                data: results,
                error: false
            });

    });
});
router.get('/getAllParts', customerMiddleware.create, (req, res, next) => {

    db.query('select * from part_master where markDelete = 0',
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

    });

});
router.put('/update/:id', customerMiddleware.create, (req, res, next) => {
    console.log("======================");
    console.log("Updating record: ", req.params.id);
    console.log("======================");
    if (!req.body.part_no) {
        return res.status(201).send({
            msg: "Part Number can not be empty",
            err: true
        });
    }

    var params = req.body;
    console.log(params);
    const current = Date.now();
    db.query('UPDATE `part_master` SET `part_no`=?,`uom`=?, `part_description`=?, `status`=? where `id`=?',
        [req.body.part_no, req.body.uom, req.body.part_description, req.body.status, req.params.id],
        function (error, results, fields) {
        if (error) {
          throw error;
          return res.status(201).send({
            msg: error,
            err: true
          });
        }
        if(results) {
            db.query(
              `UPDATE part_master SET updated_on = now() WHERE id = '${req.params.id}';`
            );

        }
        return res.status(200).send({
            data: results,
            msg: 'Record has been updated successfully!',
            err: false
        });

    });
});
router.put('/temp-delete/:id', customerMiddleware.create, (req, res, next) => {
    console.log("======================");
    console.log("Deleting record: ", req.params.id);
    console.log("======================");

    var params = req.body;
    console.log(params);
    const current = Date.now();
    db.query('UPDATE `part_master` SET `markDelete`=? where `id`=?',
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
            msg: 'Record has been marked as deleted successfully!',
            err: false
        });

    });
});
router.delete('/delete', customerMiddleware.create, (req, res, next) => {
    console.log("======================");
    console.log("Deleting Record: ", req.body.id);
    console.log("======================");
        db.query('DELETE FROM `part_master` WHERE `id`=?',
        [req.body.id], function (error, results, fields) {
            if (error) {
              throw error;
              return res.status(201).send({
                msg: error,
                err: true
              });
            }
            console.log(results);
            return res.status(200).send({ err: false, msg: 'Record has been deleted!'});

        });
});
module.exports = router;
