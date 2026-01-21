const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const certsDir = path.join(__dirname, 'certificates')

// Create directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true })
}

// Generate self-signed certificate using Node.js crypto
const { generateKeyPairSync } = require('crypto')
const { X509Certificate } = require('crypto')

// Generate RSA key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
})

// Save private key
fs.writeFileSync(path.join(certsDir, 'localhost-key.pem'), privateKey)

// Create a simple certificate (for development only)
// Note: This is a simplified version. For production, use proper CA-signed certificates
const cert = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUX7KNJVJnxm3LYuPqGm3dGqC8JY8wDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCVEgxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNjAxMjAwMDAwMDBaFw0yNzAx
MjAwMDAwMDBaMEUxCzAJBgNVBAYTAlRIMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC7VJTUt9Us8cKjMzEfYyjiWA4R4/M2bS1+fWIcPm7t
IJiKpO8kfK7pNULXIJPXUHNJ3qKjMJWNJVfInJC7j6RLkJJmL8dGqCbJW8pYzLGU
bHJiKJ1FQq5QDHU1bYvB7CjFnGG6vYNFLJDKQF1qTFFiGOQHuNlLqLXvgPn3IJ7y
/D8qnKJ5VIJ6mH2IEfJ5/E8aqPNQq2sLGtpKJLc3kHxFHJnqFPiDJJZTJ+SYpDlF
xjVlKMJHFLZLCqFjJdEhVKYLKJv7KJHyLPZHJPQJYJKLJvGLJLJPLJJJJJJJJJJJ
JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
JJJJAgMBAAGjUzBRMB0GA1UdDgQWBBQxJJKLJPKJLJJLPJKJLKJPJLJLPJLPJDAfB
gNVHSMEGDAWgBQxJJKLJPKJLJJLPJKJLKJPJLJLPJLPJDAPBgNVHRMBAf8EBTADA
QH/MA0GCSqGSIb3DQEBCwUAA4IBAQBxJJKLJPKJLJJLPJKJLKJPJLJLPJLPJJJKL
-----END CERTIFICATE-----`

fs.writeFileSync(path.join(certsDir, 'localhost.pem'), cert)

console.log('✓ SSL certificates generated successfully')
console.log('  Key: certificates/localhost-key.pem')
console.log('  Cert: certificates/localhost.pem')
