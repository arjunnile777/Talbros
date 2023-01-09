const mysql = require('mysql');
const connection = mysql.createConnection({
    host:'localhost',
    user: 'root',
    database: 'testing-app',
    password: ''
});
connection.connect();
module.exports = connection;

