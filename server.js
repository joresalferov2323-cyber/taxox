const express = require('express');
const request = require('request');
const app = express();

app.get('/proxy', (req, res) => {
  const cameraUrl = 'http://85.173.234.243/site/embed.html?id=5517&html5';
  req.pipe(request(cameraUrl)).pipe(res);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Proxy server running');
});
