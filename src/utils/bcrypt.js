const bcrypt = require('bcrypt')

exports.EncryptPass = async password => {
  try {
    const enc = await bcrypt.hash(password, 12)
    return enc
  } catch (error) {
    return error.message
  }
}

exports.VerifytPass = async (password, hpassword) => {
  try {
    const dec = await bcrypt.compare(password, hpassword)
    return dec
  } catch (error) {
    return error.message
  }
}
