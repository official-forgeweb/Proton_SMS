const http = require('http');

async function main() {
  console.log('Logging in...');
  const loginData = JSON.stringify({ email: 'admin@protoncoaching.com', password: 'Admin@123' });
  
  const token = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.data && data.data.accessToken) {
            resolve(data.data.accessToken);
          } else {
            reject(new Error('Login failed: ' + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Login successful! Access token obtained.');

  // Helper to make a GET request
  const fetchUrl = (path) => {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = http.request({
        hostname: 'localhost',
        port: 5001,
        path: path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            time: Date.now() - start,
            success: res.statusCode === 200 || res.statusCode === 304
          });
        });
      });
      req.on('error', (err) => resolve({ status: 500, time: Date.now() - start, error: err.message }));
      req.end();
    });
  };

  console.log('\nSending two CONCURRENT requests to /api/enquiries...');
  const p1 = fetchUrl('/api/enquiries');
  const p2 = fetchUrl('/api/enquiries');

  const [r1, r2] = await Promise.all([p1, p2]);
  console.log('Request 1 Result:', r1);
  console.log('Request 2 Result:', r2);

  console.log('\nSending two CONCURRENT requests to /api/dashboard/admin/charts...');
  const c1 = fetchUrl('/api/dashboard/admin/charts');
  const c2 = fetchUrl('/api/dashboard/admin/charts');

  const [cr1, cr2] = await Promise.all([c1, c2]);
  console.log('Chart Request 1 Result:', cr1);
  console.log('Chart Request 2 Result:', cr2);
}

main().catch(console.error);
