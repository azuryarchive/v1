const mongoose = require('mongoose')

const string = {
  type: String,
  required: true,
}

const accountlessUploadSchema = mongoose.Schema({
  name: string,
  size: string,
  type: string,
})

module.exports = mongoose.model('aupload', accountlessUploadSchema, 'aupload')