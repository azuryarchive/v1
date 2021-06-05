const mongoose = require('mongoose')

const string = {
  type: String,
  required: true,
}

const uploadSchema = mongoose.Schema({
  user: string,
  name: string,
  size: string,
  type: string,
  flags: {
    type: [String], // [favorite, archived, trashed]
  },
}, { timestamps: true })

module.exports = mongoose.model('upload', uploadSchema, 'upload')