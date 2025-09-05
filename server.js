const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log('Request for ' + req.url);

    // --- Redirect routes ---
    if (req.url === '/') {
        res.writeHead(302, { 'Location': '/login.html' });
        return res.end();
    }

    if (req.url === '/app') {
        res.writeHead(302, { 'Location': '/seismosens.html' });
        return res.end();
    }

    // Admin route
    if (req.url === '/admin' || req.url === '/admin/') {
        res.writeHead(302, { 'Location': '/admin/admin.html' });
        return res.end();
    }

    // --- Handle favicon.ico supaya nggak error ---
    if (req.url === '/favicon.ico') {
        res.writeHead(204); // No Content
        return res.end();
    }

    // --- Normal file serving ---
    let requestPath = req.url.split('?')[0];

    // Kalau URL ada "/public/", hapus biar nggak double public/public
    if (requestPath.startsWith('/public/')) {
        requestPath = requestPath.replace('/public/', '');
    }

    let filePath = path.join(__dirname, 'public', requestPath);

    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch (err) {
        if (!path.extname(filePath)) {
            filePath += '.html';
        }
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code + '\n');
                console.error('Server error:', error);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Press Ctrl+C to stop the server');
    console.log('Available pages:');
    console.log(`- Login: http://localhost:${port}/login.html`);
    console.log(`- Register: http://localhost:${port}/register.html`);
    console.log(`- Main App: http://localhost:${port}/index.html`);
    console.log(`- Admin: http://localhost:${port}/admin/admin.html`);
});