const http = require('http');

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });

    req.on('error', (e) => resolve({ error: e.toString() }));
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Test: name too short ("Short" -> 5 chars)');
  console.log(await post('/api/v1/playlists', { name: 'Short', author: 'tester' }));

  console.log('\nTest: missing name (empty object)');
  console.log(await post('/api/v1/playlists', {}));

  console.log('\nTest: name not a string');
  console.log(await post('/api/v1/playlists', { name: 12345 }));

  console.log('\nTest: songs not array');
  console.log(await post('/api/v1/playlists', { name: 'ValidName', songs: 'nope' }));

  console.log('\nTest: song item missing title');
  console.log(await post('/api/v1/playlists', { name: 'ValidName', songs: [{ artist: 'Singer' }] }));

  process.exit(0);
})();
