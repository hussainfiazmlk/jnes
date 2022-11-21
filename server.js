const dotenv = require("dotenv");
const express = require("express");
const app = express();
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");

const CRUD = require('./generic/Crud');
const API = require("./generic/API");

// fetch all env setting
dotenv.config();

// middleware
app.use(cors());
app.use(compression());
app.use(cors());
app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// home endpoints
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: "Welcome to backend Development" });
});

// call generic api
const crud = new CRUD();
const api = new API(crud);

app.post('/api/v1/:table', async (req, res) => api.create(req, res));
app.get('/api/v1/:table/:id?', async (req, res) => api.read(req, res));
app.patch('/api/v1/:table/:id', (req, res) => api.update(req, res));
app.delete('/api/v1/:table/:id', (req, res) => api.update(req, res));          // hidden data
app.delete('/api/v1/delete/:table/:id', (req, res) => api.delete(req, res));  // delete data permanently

// if endpoint not found
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: "404 Not Found" });
});

const port = process.env.PORT || 3000;
const host = process.env.host || "localhost";

app.listen(port, () => {
  console.log(`Server is running on http://${host}:${port}`);
});