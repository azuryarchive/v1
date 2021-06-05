const mongoose = require('mongoose')

const string = {
  type: String,
  required: true,
}

const teamUploadSchema = mongoose.Schema({
  team: string,
  user: string,
  name: string,
  size: string,
  type: string,
  flags: [String]
}, { timestamps: true })

module.exports = mongoose.model('team-upload', teamUploadSchema, 'team-upload')