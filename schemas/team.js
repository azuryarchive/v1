const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}

const teamSchema = mongoose.Schema({
  name: reqString,
  owner: reqString,
  members: {
    type: [String],
  },
  icon: {
    type: String,
    default: 0,
  },
  flags: {
    type: [String],
  },
}, { timestamps: true })

module.exports = mongoose.model('team', teamSchema, 'team')