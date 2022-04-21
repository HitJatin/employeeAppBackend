const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db= require('./queries');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
  });

  app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  });
  
app.get('/records', db.getAllEmployees);
app.post('/records', db.addEmployee);
app.get('/record/:emp_id', db.getEmployeeById);
app.put('/record/:emp_id', db.updateEmployee);
app.delete('/record/:emp_id', db.deleteEmployee);
