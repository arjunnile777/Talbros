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
    if (!req.body.name) {
        return res.status(201).send({
            msg: "Name can not be empty",
            err: true
        });
    }

    var params = req.body;
    console.log(params);

    db.query("INSERT INTO customer_master SET ? ", params,
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
    var query1 = 'select count(*) as TotalCount from customer_master where markDelete=0';
    if(req.body.name) {
        query1 += ' AND name LIKE '+ db.escape('%'+req.body.name+'%');
    }
    if(req.body.phone) {
        query1 += ' AND phone LIKE '+ db.escape('%'+ parseInt(req.body.phone) +'%')
    }
    if(req.body.contact_person) {
        query1 += ' AND contact_person LIKE '+ db.escape('%'+req.body.contact_person+'%')
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
    if(req.body.name) {
        query += ' AND name LIKE '+ db.escape('%'+req.body.name+'%');
    }
    if(req.body.phone) {
        query += ' AND phone LIKE '+ db.escape('%'+ parseInt(req.body.phone) +'%')
    }
    if(req.body.contact_person) {
        query += ' AND contact_person LIKE '+ db.escape('%'+req.body.contact_person+'%')
    }
    query += ' ORDER BY created_on DESC limit ? OFFSET ?';
    var table = ["customer_master",LimitNum,(startNum - 1)*LimitNum];

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
router.get('/getAllCustomers', customerMiddleware.create, (req, res, next) => {

    db.query('select * from customer_master where markDelete = 0',
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
router.get('/getById/:id', customerMiddleware.create, (req, res, next) => {
    console.log(req.params.id)
    db.query('select * from customer_master where id=?',
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
router.put('/update/:id', customerMiddleware.create, (req, res, next) => {
    console.log("======================");
    console.log("Updating record: ", req.params.id);
    console.log("======================");
    if (!req.body.name) {
        return res.status(201).send({
            msg: "Name can not be empty",
            err: true
        });
    }

    var params = req.body;
    console.log(params);
    const current = Date.now();
    db.query('UPDATE `customer_master` SET `name`=?,`address`=?, `phone`=?, `code`=?, `contact_person`=?, `status`=? where `id`=?',
        [req.body.name, req.body.address, req.body.phone, req.body.code, req.body.contact_person, req.body.status, req.params.id],
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
              `UPDATE customer_master SET updated_on = now() WHERE id = '${req.params.id}';`
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
    console.log("Temporarily deleting record: ", req.params.id);
    console.log("======================");

    var params = req.body;
    console.log(params);
    const current = Date.now();
    db.query('UPDATE `customer_master` SET `markDelete`=? where `id`=?',
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
        db.query('DELETE FROM `customer_master` WHERE `id`=?',
        [req.body.id], function (error, results, fields) {
            if (error) {
              throw error;
              return res.status(201).send({
                msg: error,
                err: true
              });
            }
            return res.status(200).send({ err: false, msg: 'Record has been deleted!'});

        });
});
module.exports = router;
