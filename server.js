const express = require('express');
const request = require('request');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

// Прокси: JS-плеер
app.get('/proxy-js/fpst.flv.js', (req, res) => {
  const jsUrl = 'http://85.173.234.243/js/fpst.flv.js';
  req.pipe(request(jsUrl)).pipe(res);
});

// Прокси: видеопоток FLV
app.get('/stream', (req, res) => {
  const streamUrl = 'http://85.173.234.244:9000/rtsp/23606289/c496f32f37858535ac1d';
  req.pipe(request(streamUrl)).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
