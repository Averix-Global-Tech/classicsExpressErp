const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
       console.log('API Response:', response.url(), response.status());
       if (response.status() >= 400) {
           console.log('Error Body:', await response.text());
       }
    }
  });

  await page.goto('http://localhost:5173/login');
  
  const http = require('http');
  const adminLoginOpts = { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } };
  const req = http.request(adminLoginOpts, (res) => {
    let data = ''; res.on('data', d => data += d);
    res.on('end', () => {
      const cookies = res.headers['set-cookie'];
      const empData = JSON.stringify({ name: 'Test Emp5', email: 'emp5@test.com', password: 'Password123', role: 'employee' });
      const createOpts = { hostname: 'localhost', port: 5000, path: '/api/users', method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookies.join(';') } };
      const createReq = http.request(createOpts, (createRes) => {
        let cd = ''; createRes.on('data', d => cd += d);
        createRes.on('end', async () => {
           await page.type('input[type="email"]', 'emp5@test.com');
           await page.type('input[type="password"]', 'Password123');
           await page.click('button[type="submit"]');
           await page.waitForNavigation();
           
           console.log('Current URL after login:', page.url());
           
           await page.goto('http://localhost:5173/shipments/dashboard');
           await new Promise(r => setTimeout(r, 2000));
           
           await browser.close();
           process.exit(0);
        });
      });
      createReq.write(empData); createReq.end();
    });
  });
  req.write(JSON.stringify({ email: 'admin@classicexpress.com', password: 'Admin@Classic2025' })); req.end();
})();

// as;lsdjfkjdsak;lf