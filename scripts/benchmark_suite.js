const http = require('http');

async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const postData = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: reqHeaders,
    };

    const startTime = process.hrtime.bigint();

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number(endTime - startTime) / 1e6;
        resolve({
          statusCode: res.statusCode,
          latencyMs,
          dataLength: data.length,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 500,
        latencyMs,
        dataLength: 0,
        success: false,
        error: err.message,
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function benchmarkEndpoint(name, url, method = 'GET', body = null, headers = {}, concurrency = 50, durationSec = 3) {
  process.stdout.write(`Benchmarking ${name} (${concurrency} concurrency for ${durationSec}s)... `);

  const results = [];
  const startTime = Date.now();
  const endTime = startTime + durationSec * 1000;

  let active = 0;
  let totalRequests = 0;

  async function worker() {
    while (Date.now() < endTime) {
      totalRequests++;
      const res = await makeRequest(url, method, body, headers);
      results.push(res);
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const actualDurationMs = Date.now() - startTime;

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const totalReq = results.length;
  const successReq = results.filter((r) => r.success).length;

  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / (totalReq || 1);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const p50 = latencies[Math.floor(totalReq * 0.50)] || 0;
  const p95 = latencies[Math.floor(totalReq * 0.95)] || 0;
  const p99 = latencies[Math.floor(totalReq * 0.99)] || 0;
  const rps = (totalReq / (actualDurationMs / 1000)).toFixed(1);

  console.log(`DONE (${totalReq} reqs, ${rps} RPS)`);

  return {
    name,
    url,
    method,
    totalRequests: totalReq,
    successRequests: successReq,
    rps: Number(rps),
    avgMs: Number(avgLatency.toFixed(2)),
    minMs: Number(minLatency.toFixed(2)),
    p50Ms: Number(p50.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    maxMs: Number(maxLatency.toFixed(2)),
  };
}

async function main() {
  console.log('================================================================================================');
  console.log('🚀 MYG BACKEND ENTERPRISE PERFORMANCE BENCHMARK & PROFILING');
  console.log('================================================================================================\n');

  // Obtain admin access token
  let authToken = '';
  const loginRes = await makeRequest(
    'http://localhost:5000/api/v1/auth/login',
    'POST',
    { email: 'admin@gurujewellers.com', password: 'AdminPassword@2026' }
  );

  try {
    const data = JSON.parse(loginRes.data || '{}');
    authToken = data.data?.accessToken || '';
  } catch (e) {}

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const suite = [
    { name: '1. Health Check API', url: 'http://localhost:5000/api/v1/health', method: 'GET' },
    { name: '2. Auth Login API', url: 'http://localhost:5000/api/v1/auth/login', method: 'POST', body: { email: 'admin@gurujewellers.com', password: 'AdminPassword@2026' } },
    { name: '3. Categories API', url: 'http://localhost:5000/api/v1/categories', method: 'GET' },
    { name: '4. Price Rules API', url: 'http://localhost:5000/api/v1/prices', method: 'GET' },
    { name: '5. Banners API', url: 'http://localhost:5000/api/v1/banners', method: 'GET' },
    { name: '6. Products By Slug API', url: 'http://localhost:5000/api/v1/products/jewelry', method: 'GET' },
    { name: '7. Cart Listing API', url: 'http://localhost:5000/api/v1/cart/21eb342e-0040-41aa-ac73-b6e3c6f82394', method: 'GET', headers: authHeaders },
    { name: '8. Wishlist Listing API', url: 'http://localhost:5000/api/v1/wishlist/21eb342e-0040-41aa-ac73-b6e3c6f82394', method: 'GET', headers: authHeaders },
    { name: '9. Promo Code Validate API', url: 'http://localhost:5000/api/v1/promocodes/validate', method: 'POST', body: { code: 'WELCOME10', orderAmount: 50000 } },
  ];

  const benchmarkResults = [];

  for (const item of suite) {
    const res = await benchmarkEndpoint(item.name, item.url, item.method, item.body, item.headers, 30, 3);
    benchmarkResults.push(res);
  }

  console.log('\n================================================================================================');
  console.log('📊 BENCHMARK METRICS RESULTS');
  console.log('================================================================================================');
  console.table(
    benchmarkResults.map((r) => ({
      Endpoint: r.name,
      'Avg (ms)': r.avgMs,
      'P50 (ms)': r.p50Ms,
      'P95 (ms)': r.p95Ms,
      'P99 (ms)': r.p99Ms,
      'Max (ms)': r.maxMs,
      'RPS (req/s)': r.rps,
      'Total Req': r.totalRequests,
      Success: r.successRequests,
    }))
  );

  console.log('\n--- METRICS_JSON_START ---');
  console.log(JSON.stringify(benchmarkResults, null, 2));
  console.log('--- METRICS_JSON_END ---');
}

main().catch(console.error);
