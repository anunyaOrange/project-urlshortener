require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const bodyParser = require('body-parser');
const url = require('node:url');

// Basic Configuration
const port = process.env.PORT || 3000;

let database = [];

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(req.method + " " + req.path + " - " + req.ip);
  console.log('body:', req.body);
  next();
});

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const originalUrl = new url.URL(req.body.url);

  // console.log('Received URL:', req.body.url);
  // console.log('Parsed URL:', originalUrl.host);


  function isValidHttpUrl(str) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))|' + // OR ip (v4) address
      '(localhost)' + // OR localhost
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
      'i'
    );
    return pattern.test(str);
  }

  const isLocalhost = originalUrl.host.substring(0, 9) === 'localhost';
  // console.log('Is localhost:', isLocalhost, `${originalUrl.host.substring(0, 9)}`);

  dns.lookup(originalUrl.host, (err, address) => {
    console.log('DNS lookup result:', err, address);
    if ((!isLocalhost) && (err || !address)) {
      // return res.status(400).json({ error: 'invalid url' });
      return res.json({ error: 'invalid url' });
    }

    database.push(`${req.body.url}`);
    const result = { original_url: database[database.length - 1], short_url: `${database.length}` };

    console.log('Database:', database);
    console.log('Result:', result);

    res.json(result);
  });
});

app.get('/api/shorturl/:short_url', function (req, res) {
  const numUrl = Number(req.params.short_url);
  if (numUrl) {
    if (numUrl > database.length || numUrl < 1) {
      return res.status(404).json({ error: 'short url not found' });
    }
    const originalUrl = database[numUrl - 1];
    console.log('Original URL:', originalUrl);
    res.redirect(originalUrl);
  } else {
    res.status(400).json({ error: 'invalid url' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
