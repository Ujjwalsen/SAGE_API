const http = require('http');

const endpoints = [
    '/api/data',
    '/api/unknown',
    '/api/test',
    '/'
];

const sendRequest = () => {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        method: 'GET',
        headers: {
            'User-Agent': Math.random() > 0.8 ? 'bot-tester' : 'Mozilla/5.0'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Request to ${endpoint} - Status: ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
};

console.log("🚀 Starting traffic simulation on port 3000...");
console.log("Press Ctrl+C to stop.");

// Send a request every 200ms
setInterval(sendRequest, 2000);
setInterval(sendRequest, 1500);
setInterval(sendRequest, 1000);

