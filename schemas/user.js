const mongoose = require('mongoose')
const { customAlphabet } = require('nanoid')
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZa_bcdefghijklmnopqr-stuvwxyz0123456789.'
const token = customAlphabet(alphabet, 512)

/* 
  USER FLAGS:

  0: Admin
  1: Employee
  2: Verified Developer
*/

/* 
  PRIME TYPES:

  0: None
  1: Basic
  2: Prime
  3: Prime+
*/

const userSchema = mongoose.Schema({
  _id: {
    type: String
  },
  avatar: {
    type: String,
    default: 0
  },
  flags: {
    type: [Number]
  },
  connections: {
    type: [{}], // [{ discord: userid }, { twitter: userid }, { github: userid }]
  },
  token: {
    type: String,
    default: () => token()
  },
  access: {
    type: [String]
  }
}, { timestamps: true })

module.exports = mongoose.model('user', userSchema, 'user')