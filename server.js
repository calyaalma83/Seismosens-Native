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

    // Handle root URL
    if (req.url === '/') {
        res.writeHead(302, { 'Location': '/public/login.html' });
        return res.end();
    }

    // Handle main app route
    if (req.url === '/app') {
        res.writeHead(302, { 'Location': '/public/seismosens.html' });
        return res.end();
    }

    // Parse URL and handle paths
    let filePath = path.join(__dirname, req.url.split('?')[0]); // Remove query parameters
    
    // Check if the path exists and if it's a directory
    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // Check for index.html in the directory
            const indexFile = path.join(filePath, 'index.html');
            if (fs.existsSync(indexFile)) {
                filePath = indexFile;
            } else {
                // If no index.html, try adding .html extension
                filePath = filePath + '.html';
            }
        }
    } catch (err) {
        // If path doesn't exist, try adding .html extension
        if (!path.extname(filePath)) {
            filePath += '.html';
        }
    }

    // Get file extension and set content type
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Try to find the file in the same directory with different cases
                const dir = path.dirname(filePath);
                const fileName = path.basename(filePath);
                try {
                    const files = fs.readdirSync(dir);
                    const found = files.find(f => f.toLowerCase() === fileName.toLowerCase());
                    if (found) {
                        filePath = path.join(dir, found);
                        // Retry with the correct case
                        return fs.readFile(filePath, (err, content) => {
                            if (err) return handleError(err, res);
                            serveFile(res, filePath, contentType, content);
                        });
                    }
                } catch (err) {}
                
                // Page not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>', 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + '\n');
                console.error('Server error:', error);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Helper function to handle errors
function handleError(error, res) {
    if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>', 'utf-8');
    } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + '\n');
        console.error('Server error:', error);
    }
}

// Helper function to serve files with proper headers
function serveFile(res, filePath, contentType, content) {
    res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.end(content, 'utf-8');
}

// Start the server
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Press Ctrl+C to stop the server');
    console.log('Available pages:');
    console.log(`- Login: http://localhost:${port}/public/login.html`);
    console.log(`- Register: http://localhost:${port}/public/register.html`);
<<<<<<< HEAD
    console.log(`- Main App: http://localhost:${port}/public/index.html`);
    console.log(`- Admin: http://localhost:${port}/admin/admin.html`);
=======
    console.log(`- Main App: http://localhost:${port}/public/seismosens.html`);
>>>>>>> 56ad33b7b4ff55894abb36ed371c91bff165cf3b
});