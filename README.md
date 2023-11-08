<!-- exclude fields ->  .select('-passwordHash -name')
include only these fields -> .select('passwordHash name') -->

<!-- Encrypt
var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'secret key 123').toString();

Decrypt
var bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)); -->