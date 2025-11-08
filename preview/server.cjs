const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/search-demo.html' : req.url;
  const filePath = path.join(__dirname, urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const type = ext === '.html' ? 'text/html' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
});
