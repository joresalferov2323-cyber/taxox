const express = require('express');
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Проксируем поток FLV
app.get('/flvstream', (req, res) => {
  const streamUrl = 'http://85.173.234.244:9000/rtsp/23606289/c496f32f37858535ac1d';
  req.pipe(request(streamUrl)).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
