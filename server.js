const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Certificate paths
const certsDir = path.join(__dirname, 'certificates')
const pfxPath = path.join(certsDir, 'localhost.pfx')

// HTTPS options
const httpsOptions = {
  pfx: fs.readFileSync(pfxPath),
  passphrase: 'password'
}

console.log('✓ Using SSL certificate from', pfxPath)

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`\n✓ Ready on https://${hostname}:${port}`)
      console.log(`  Environment: ${dev ? 'development' : 'production'}`)
      console.log(`\n⚠ Note: Self-signed certificate - you may see browser warnings`)
      console.log(`  To trust the certificate, accept the security exception in your browser\n`)
    })
})
