const selfsigned = require('selfsigned')

const attrs = [{ name: 'commonName', value: 'localhost' }]
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
})

console.log('Generated certificate structure:')
console.log('Keys:', Object.keys(pems))
console.log('Has private?', !!pems.private)
console.log('Has cert?', !!pems.cert)
console.log('Private type:', typeof pems.private)
console.log('Cert type:', typeof pems.cert)
