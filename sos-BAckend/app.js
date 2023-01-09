const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const router = require('./routes/router.js');
const router2 = require('./routes/customer_master.js');
const router3 = require('./routes/part_master.js');
const router4 = require('./routes/station_master.js');
const router5 = require('./routes/employee_master.js');
const router6 = require('./routes/customer_part_link.js');
const router7 = require('./routes/planning.js');
const router8 = require('./routes/client.js');
app.use('/api', router);
app.use('/api/customer', router2);
app.use('/api/part', router3);
app.use('/api/station', router4);
app.use('/api/employee', router5);
app.use('/api/customer-part', router6);
app.use('/api/planning', router7);
app.use('/api/client', router8);
app.listen(PORT, () => console.log('Server is running on port:'+ PORT));
