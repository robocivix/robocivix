// server.js
const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const port = 3000
const rootDir = path.resolve(__dirname) // Ensure it points to the current directory

const requestHandler = (req, res) => {
	// Safely resolve the file path to prevent directory traversal attacks
	const filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url)

	// Prevent access to files outside the current directory
	if (!filePath.startsWith(rootDir)) {
		res.statusCode = 403
		res.end('Forbidden')
		return
	}
    
	// Get the MIME type based on the file extension
	const contentType = mime.lookup(filePath) || 'application/octet-stream'

	// Read the file and send it as a response
	fs.readFile(filePath, (err, data) => {
		if (err) {
			console.error("File not found", filePath)
			res.statusCode = 400
			res.end('' + err)
		} else {
			res.statusCode = 200
			res.setHeader('Content-Type', contentType)
			res.end(data)
		}
	})
}

// Create and start the server
const server = http.createServer(requestHandler)

server.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
