async function run() {
  const loginUrl = 'http://localhost:5001/api/auth/login';
  const healthUrl = 'http://localhost:5001/api/whatsapp/debug/health';
  const logsUrl = 'http://localhost:5001/api/whatsapp/webhook/logs';

  try {
    console.log('Logging in as admin...');
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@protoncoaching.com',
        password: 'Admin@123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Login successful. Access token acquired.');

    console.log('Calling whatsapp/debug/health...');
    const healthRes = await fetch(healthUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`Health Status: ${healthRes.status}`);
    const healthText = await healthRes.text();
    console.log(`Health Response body: ${healthText}`);

    console.log('Calling whatsapp/webhook/logs...');
    const logsRes = await fetch(logsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`Logs Status: ${logsRes.status}`);
    const logsText = await logsRes.text();
    console.log(`Logs Response body: ${logsText}`);
  } catch (error) {
    console.error('Error in request:', error);
  }
}

run();
