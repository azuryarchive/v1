/******************************** DEPENDENCIES ********************************/

const config = require('./config.json')
const mongoose = require('mongoose')
const userSchema = require('./schemas/user')
const uploadSchema = require('./schemas/upload')
const accountlessUploadSchema = require('./schemas/accountlessUpload')
const teamSchema = require('./schemas/team')
const teamUploadSchema = require('./schemas/teamUpload')
const { parse } = require('path')
const objectID = mongoose.Types.ObjectId
const https = require('https')
const { Client } = require('discord.js')
const lru = require('lru-cache')
const aws = require('aws-sdk')

// ---------------- ENVIRONMENT VARIABLES ---------------- //

require('dotenv').config()
const env = process.env

// ---------------- S3 ---------------- //

const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com')
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: env.spacesKey,
  secretAccessKey: env.spacesSecret
})

// ---------------- DISCORD.JS ---------------- //

const client = new Client()
client.login(env.token)
client.on('ready', () => {
  console.log('Discord.js was successfully launched.')
})

// ---------------- CACHE ---------------- //

const maxAge = { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7d
const serviceMaxAge = { maxAge: 60 * 60 * 1000 } // 1h

const teamUploadCache = new lru(maxAge)
const accountlessUploadCache = new lru(maxAge)
const uploadCache = new lru(maxAge)
const userCache = new lru(maxAge)
const teamCache = new lru(maxAge)
const userDataCache = new lru(maxAge)
const serviceCache = new lru(serviceMaxAge)
const discordUserCache = new lru(maxAge)

/******************************** S3 HANDLER ********************************/

let s3Prefix
if (env.build = 'development') {
  s3Prefix = 'dev/'
} else {
  s3Prefix = ''
}

// ---------------- EMPTY DIRECTORY ---------------- //

async function emptyDirectory(dir) {
  const listParams = {
    Bucket: env.spacesName,
    Prefix: `${s3Prefix}${dir}`
  }

  const listedObjects = await s3.listObjectsV2(listParams).promise()

  if (listedObjects.Contents.length === 0) return false

  const deleteParams = {
    Bucket: env.spacesName,
    Delete: { Objects: [] }
  }

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key })
  })

  await s3.deleteObjects(deleteParams).promise()

  if (listedObjects.IsTruncated) await emptyDirectory(dir)

  return true
}

// ---------------- PUT OBJECT ---------------- //

async function putObject(req, file, owner, type) {
  const encodedName = file.name.replace(/[^a-z0-9]/gui, '').toLowerCase()

  let params 
  if (type == 'team') {
    params = {
      Body: req.files.upload.data,
      Bucket: env.spacesName,
      Key: `${s3Prefix}teams/${owner}/${file._id}/${encodedName}${file.type}`,
      ACL: 'public-read'
    }
  } else {
    params = {
      Body: req.files.upload.data,
      Bucket: env.spacesName,
      Key: `${s3Prefix}${owner}/${file._id}/${encodedName}${file.type}`,
      ACL: 'public-read'
    }
  }

  s3.putObject(params, function(err) {
    if (err) return false
  })

  return true
}

// ---------------- CLONE OBJECT ---------------- //

async function cloneObject(file, clone, type) {
  const encodedName = file.name.replace(/[^a-z0-9]/gui, '').toLowerCase()

  let owner
  if (type == 'team') {
    owner = `teams/${file.team}`
  } else {
    owner = file.user
  }

  let oldKey = `${s3Prefix}${owner}/${file._id}/${encodedName}${file.type}`
  let newKey = `${s3Prefix}${owner}/${clone._id}/${encodedName}${file.type}`
  
  const params = {
    Bucket: env.spacesName, 
    CopySource: `/${env.spacesName}/${oldKey}`, 
    Key: newKey,
    ACL: 'public-read'
  }
  
  s3.copyObject(params, function(err) {
    if (err) return false
  })

  return true
}

// ---------------- RENAME OBJECT ---------------- //

async function renameObject(file, newName, type) {
  const encodedName = file.name.replace(/[^a-z0-9]/gui, '').toLowerCase()
  const encodedNewName = newName.replace(/[^a-z0-9]/gui, '').toLowerCase()

  let owner
  if (type == 'team') {
    owner = `teams/${file.team}`
  } else {
    owner = file.user
  }

  const oldKey = `${s3Prefix}${owner}/${file._id}/${encodedName}${file.type}`
  const newKey = `${s3Prefix}${owner}/${file._id}/${encodedNewName}${file.type}`

  const paramsBefore = {
    Bucket: env.spacesName, 
    CopySource: `/${env.spacesName}/${oldKey}`, 
    Key: newKey,
    ACL: 'public-read'
  }

  const paramsAfter = {
    Bucket: env.spacesName, 
    Key: oldKey
  }

  await s3.copyObject(paramsBefore, function(err) {
    if (err) return false
  }).promise()
    .then(() => s3.deleteObject(paramsAfter).promise())
    .catch((e) => { return false })
}

// ---------------- DELETE OBJECT ---------------- //

async function deleteObject(file, type) {
  let owner
  if (type == 'team') {
    owner = `teams/${file.team}`
  } else {
    owner = file.user
  }

  const key = `${s3Prefix}${owner}/${file._id}/${file.name.replace(/[^a-z0-9]/gui, '').toLowerCase()}${file.type}`
  const params = {
    Bucket: env.spacesName, 
    Key: key
  }

  await s3.deleteObject(params, function(err) {
    if (err) return false
  }).promise()

  return true
}

/******************************** GENERAL ********************************/

// get user id
async function userID(req) {
  if (req.query.token == null) return false
  if (req.query.token != encodeURIComponent(req.query.token)) return false
  const token = req.query.token
  const userData = userCache.get(token)
  if (userData != null) return userData._id
  const user = await userSchema.findOne({ 'token': token }, ( err, success ) => {
    if (err) return false
  })
  if (!user) return false
  userCache.set(token, user)
  return user._id
}

// check if discord id is valid
async function validDiscord(id) {
  if (encodeURIComponent(id) != id) return false
  if (id.length > 18) return false
  if (/^\d+$/.test(id) == false) return false
  const generateID = encodeURIComponent(id)
  if (id != generateID) return false
  return true
}

// check if object id is valid
function validObject(id) {
  if (id == null || id == 'undefined' || id == '' || id == undefined) return false
  const encodedID = encodeURIComponent(id)
  if (objectID.isValid(encodedID) == false) return false
  const generateID = new objectID(encodedID)
  if (generateID != encodedID) return false
  return true
}

function readableSize(bytes, decimals = 2) {
  if (bytes == 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/******************************** DASHBOARD FUNCTIONS ********************************/

// ---------------- USER ---------------- //

async function dashUser(id) {
  const cached = userCache.get(id)

  if (cached) {
    return cached
  } else {
    const user = await userSchema.findOne({ '_id': id }, ( err, success ) => {
      if (err) return false
    })

    return user
  }
}

// ---------------- DISCORD USER ---------------- //

async function dashDiscordUser(id) {
  const cached = discordUserCache.get(id)

  if (cached) {
    return cached
  } else {
    const user = await client.users.fetch(id)
    discordUserCache.set(id, user)
    return user
  }
}

// ---------------- FILES ---------------- //

async function dashFiles(req, type) {
  if (type == 'all') {
    const files = await uploadSchema.find({ user: req.user.id, flags: { '$ne': 'trashed' }, flags: { '$ne': 'trashed' } }, function (err, success) {
      if (err) return false
    })

    return files
  } else if (type == 'trash') {
    const files = await uploadSchema.find({ user: req.user.id, flags: 'trashed' }, function (err, success) {
      if (err) return false
    })

    return files
  } else {
    const files = await uploadSchema.find({ user: req.user.id, flags: { '$ne': 'trashed' }, flags: 'archived' }, function (err, success) {
      if (err) return false
    })

    return files
  }
}

// ---------------- TEAM ---------------- //

async function dashTeam(id) {
  if (validObject(id) == false) return false
  const cached = teamCache.get(id)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': id }, (err, success) => {
      if (err) return false
    })
  }

  const files = await teamUploadSchema.find({ 'team': id }, (err, success) => {
    if (err) return false
  })

  if (files == null || team == null) return false

  const membersPromise = await team.members.map(member => client.users.fetch(member))
  const members = await Promise.all(membersPromise)

  const data = {
    'details': team,
    'files': files,
    'members': members
  }

  return data
}

// ---------------- TEAMS ---------------- //

async function dashTeams(user) {
  const teams = await teamSchema.find({ 'members': user }, (err, success) => {
    if (err) return false
  })

  return teams
}

/******************************** FUNCTIONS ********************************/

// ---------------- UPLOAD ---------------- //

async function uploadFile(req, type) {
  if (!req.files) return { 'code': 400, 'status': 'No Files Provided' }
  if (!req.files.upload) return { 'code': 400, 'status': 'No File Provided' }
  const { ext } = parse(req.files.upload.name)
  if (!ext) return { 'code': 400, 'status': 'Invalid File Extension' }
  const { name } = parse(req.files.upload.name)
  if (!name) return { 'code': 400, 'status': 'Invalid File Name' }

  const encodedName = name.replace(/[^a-zA-Z 0-9]/g, '')
  const size = req.files.upload.size

  // accountless upload
  if (type == 'accountless') {
    if (req.files.upload.size > config.accountlessUploadLimit*1024*1024) return { 'code': 400, 'status': 'File Too Big' }

    let upload = new accountlessUploadSchema({
      name: encodedName,
      size: size,
      type: encodeURIComponent(ext)
    })

    upload.save(function (err) {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Data From Database' }
    })

    accountlessUploadCache.set(upload._id, upload)

    const s3Upload = await putObject(req, upload, 'accountless', 'accountless')
    if (s3Upload == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    const data = {
      'name': upload.name,
      'id': upload._id,
      'type': upload.type,
      'size': size,
      'readableSize': readableSize(size),
      'url': `https://azury.gg/a/${upload._id}`
    }

    return { 'code': 200, 'status': data }
  }

  // team upload
  if (type == 'team') {
    if (!req.query.token) return { 'code': 401, 'status': 'No Token Provided' }
    if (!req.params.team) return { 'code': 400, 'status': 'No Team Provided' }
    if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
    if (req.files.upload.size > config.uploadLimit*1024*1024) return { 'code': 400, 'status': 'File Too Big' }

    const user = await userID(req)
    if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

    const team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })

    if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }

    function isMember(member, index, array) {
      return member == user
    }

    if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

    let upload = new teamUploadSchema({
      team: req.params.team,
      user: user,
      name: encodedName,
      size: size,
      type: encodeURIComponent(ext),
    })

    upload.save(function (err) {
      if (err) return { 'code': 400, 'status': 'Failed To Save Upload' }
    })

    teamUploadCache.set(upload._id, upload)

    const s3Upload = await putObject(req, upload, req.params.team, 'team')
    if (s3Upload == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    const data = {
      'name': upload.name,
      'id': upload._id,
      'type': upload.type,
      'size': upload.size,
      'readableSize': readableSize(upload.size),
      'url': `https://azury.gg/t/${upload._id}`
    }

    return { 'code': 200, 'status': data }
  }

  // user upload
  if (type == 'user') {
    if (!req.query.token) return { 'code': 400, 'status': 'No Token Provided' }
    if (req.files.upload.size > config.uploadLimit*1024*1024) return { 'code': 400, 'status': 'File Too Big' }
    const user = await userID(req)
    if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

    let upload = new uploadSchema({
      user: user,
      name: encodedName,
      size: size,
      type: encodeURIComponent(ext),
    })

    upload.save(function (err) {
      if (err) return { 'code': 400, 'status': 'Failed To Save File' }
    })

    uploadCache.set(upload._id, upload)

    const s3Upload = await putObject(req, upload, user, 'user')
    if (s3Upload == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    const data = {
      'name': upload.name,
      'id': upload._id,
      'type': upload.type,
      'size': upload.size,
      'readableSize': readableSize(upload.size),
      'url': `https://azury.gg/u/${upload._id}`
    }

    return { 'code': 200, 'status': data }
  }
}

// ---------------- CLONE ---------------- //

async function cloneFile(req, type) {
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  // team clone
  if (type == 'team') {
    const cached = teamUploadCache.get(req.params.file)

    let upload
    if (cached != null) {
      upload = cached
    } else {
      upload = await teamUploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
      })
    }
  
    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }

    const team = await teamSchema.findOne({ '_id': upload.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })

    if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }

    function isMember(member, index, array) {
      return member == user
    }

    if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

    const clone = new teamUploadSchema({
      team: upload.team,
      user: upload.user,
      name: upload.name,
      size: upload.size,
      type: upload.type
    })

    clone.save(function (err) {
      if (err) return { 'code': 400, 'status': 'Failed To Save Clone' }
    })

    const s3Clone = await cloneObject(upload, clone, 'team')
    if (s3Clone == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    teamUploadCache.set(clone._id, upload)
  
    const fileData = {
      'name': clone.name,
      'id': clone._id,
      'url': `https://azury.gg/t/${clone._id}`,
      'clonedAt': clone.createdAt
    }

    return { 'code': 200, 'status': fileData }
  }

  // user clone
  if (type == 'user') {
    const cached = uploadCache.get(req.params.file)

    let upload
    if (cached != null) {
      upload = cached
    } else {
      upload = await uploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
      })
    }
  
    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
    if (user != upload.user) return { 'code': 403, 'status': 'Access Denied' }

    clone = new uploadSchema({
      user: user,
      name: upload.name,
      size: upload.size,
      type: upload.type,
      archived: upload.archived,
      trashed: upload.trashed,
      favorite: upload.favorite
    })

    clone.save(function (err) {
      if (err) return { 'code': 400, 'status': 'Failed To Save Clone' }
    })

    const s3Clone = await cloneObject(upload, clone, 'user')
    if (s3Clone == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    uploadCache.set(clone._id, upload)

    const data = {
      'name': clone.name,
      'id': clone._id,
      'url': `https://azury.gg/u/${clone._id}`,
      'clonedAt': clone.createdAt
    }

    return { 'code': 200, 'status': data }
  }
}

// ---------------- SHORT LINK ---------------- //

function shortLink(url, callback) {
  https.get('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(url), function (res) {
    let body = ''
    res.on('data', function(chunk) { body += chunk })
    res.on('end', function() { callback(body) })
  })
}

// ---------------- TOGGLE FAVORITE ---------------- //

async function toggleFavorite(req) {
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = uploadCache.get(req.params.file)

  let upload
  if (cached != null) {
    upload = cached
  } else {
    upload = await uploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
    })
  }

  if (!upload) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
  if (user != upload.user) return { 'code': 403, 'status': 'Access Denied' }
  
  let updatedFile
  if (upload.flags.includes('favorite')) {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$pull': { 'flags': 'favorite' }}, { safe: true, multi: true, new: true })
  } else {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$push': { 'flags': 'favorite' }}, { upsert: true, new: true })
  }

  if (cached) {
    uploadCache.del(req.params.file)
    uploadCache.set(req.params.file, updatedFile)
  } else {
    uploadCache.set(req.params.file, updatedFile)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- TOGGLE ARCHIVED ---------------- //

async function toggleArchived(req) {
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = uploadCache.get(req.params.file)

  let upload
  if (cached != null) {
    upload = cached
  } else {
    upload = await uploadSchema.findOne({ '_id': req.params.file })
  }

  if (!upload) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
  if (user != upload.user) return { 'code': 403, 'status': 'Access Denied' }

  let updatedFile
  if (upload.flags.includes('archived')) {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$pull': { 'flags': 'archived' }}, { safe: true, multi: true, new: true })
  } else {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$push': { 'flags': 'archived' }}, { upsert: true, new: true })
  }

  if (cached) {
    uploadCache.del(req.params.file)
    uploadCache.set(req.params.file, updatedFile)
  } else {
    uploadCache.set(req.params.file, updatedFile)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- TOGGLE TRASHED ---------------- //

async function toggleTrashed(req) {
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = uploadCache.get(req.params.file)

  let upload
  if (cached != null) {
    upload = cached
  } else {
    upload = await uploadSchema.findOne({ '_id': req.params.file })
  }

  if (!upload) return { 'code': 400, 'status': 'Failed To Fetch Upload From Database' }
  if (user != upload.user) return { 'code': 403, 'status': 'Access Denied' }

  let updatedFile
  if (upload.flags.includes('trashed')) {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$pull': { 'flags': 'trashed' }}, { safe: true, multi: true, new: true })
  } else {
    updatedFile = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { '$push': { 'flags': 'trashed' }}, { upsert: true, new: true })
  }

  if (cached) {
    uploadCache.del(req.params.file)
    uploadCache.set(req.params.file, updatedFile)
  } else {
    uploadCache.set(req.params.file, updatedFile)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- FILE DETAILS ---------------- //

async function getFile(req, type) {
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }

  if (type == 'team') {
    let item = teamUploadCache.get(req.params.file)
    if (item) {
      const details = {
        'name': item.name,
        'id': item._id,
        'size': item.size,
        'readableSize': readableSize(item.size),
        'type': item.type,
        'url': `https://azury.gg/t/${item._id}`,
        'uploadedAt': item.createdAt,
        'updatedAt': item.updatedAt
      }
      return { 'code': 200, 'status': details }
    } else {
      const upload = await teamUploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
  
      if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
  
      const details = {
        'name': upload.name,
        'id': upload._id,
        'size': upload.size,
        'readableSize': readableSize(upload.size),
        'type': upload.type,
        'url': `https://azury.gg/t/${upload._id}`,
        'uploadedAt': upload.createdAt,
        'updatedAt': upload.updatedAt
      }

      teamUploadCache.set(req.params.file, upload)
  
      return { 'code': 200, 'status': details }
    }
  }

  if (type == 'user') {
    let item = uploadCache.get(req.params.file)
    if (item) {
      const details = {
        'name': item.name,
        'author': item.user,
        'id': item._id,
        'size': item.size,
        'readableSize': readableSize(item.size),
        'type': item.type,
        'url': `https://azury.gg/u/${item._id}`,
        'uploadedAt': item.createdAt,
        'updatedAt': item.updatedAt
      }
      return { 'code': 200, 'status': details }
    } else {
      const upload = await uploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
  
      if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
  
      const details = {
        'name': upload.name,
        'author': upload.user,
        'id': upload._id,
        'size': upload.size,
        'readableSize': readableSize(upload.size),
        'type': upload.type,
        'downloads': upload.downloads,
        'views': upload.views,
        'url': `https://azury.gg/u/${upload._id}`,
        'uploadedAt': upload.createdAt,
        'updatedAt': upload.updatedAt
      }

      uploadCache.set(req.params.file, upload)

      return { 'code': 200, 'status': details }
    }
  }

  if (type == 'accountless') {
    let item = accountlessUploadCache.get(req.params.file)
    if (item) {
      const details = {
        'name': item.name,
        'id': item._id,
        'size': item.size,
        'readableSize': readableSize(item.size),
        'type': item.type,
        'url': `https://azury.gg/a/${item._id}`
      }

      return { 'code': 400, 'status': details }
    } else {
      const upload = await accountlessUploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
  
      if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
  
      const details = {
        'name': upload.name,
        'id': upload._id,
        'size': upload.size,
        'readableSize': readableSize(upload.size),
        'type': upload.type,
        'url': `https://azury.gg/a/${upload._id}`
      }

      accountlessUploadCache.set(req.params.file, upload)
  
      return { 'code': 200, 'status': details }
    }
  }
}

// ---------------- RENAME FILE ---------------- //

async function renameFile(req, type) {
  if (!req.body.name) return { 'code': 400, 'status': 'Missing New Name' }
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }
  const encodedName = req.body.name.replace(/[^a-zA-Z 0-9]/g, '')

  if (type == 'team') {
    const cached = teamUploadCache.get(req.params.file)

    let upload
    if (cached) {
      upload = cached
    } else {
      upload = await teamUploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
    }

    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }

    const team = await teamSchema.findOne({ '_id': upload.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })

    if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }

    function isMember(member, index, array) {
      return member == user
    }

    if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

    const newUpload = await teamUploadSchema.findOneAndUpdate({ '_id': req.params.file }, { name: encodedName }, { returnOriginal: false }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    })

    if (!newUpload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }

    const s3Rename = await renameObject(upload, encodedName, 'team')
    if (s3Rename == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    if (cached) {
      teamUploadCache.del(req.params.file)
      teamUploadCache.set(req.params.file, newUpload)
    } else {
      teamUploadCache.set(req.params.file, newUpload)
    }

    return { 'code': 200, 'status': 'Success' }
  }

  if (type == 'user') {
    const cached = uploadCache.get(req.params.file)

    let upload
    if (cached) {
      upload = cached
    } else {
      upload = await uploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
    }

    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    if (upload.user != user) return { 'code': 403, 'status': 'Access Denied' }

    const newUpload = await uploadSchema.findOneAndUpdate({ '_id': req.params.file }, { name: encodedName }, { returnOriginal: false }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    })

    if (!newUpload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }

    const s3Rename = await renameObject(upload, encodedName, 'user')
    if (s3Rename == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    if (cached) {
      uploadCache.del(req.params.file)
      uploadCache.set(req.params.file, newUpload)
    } else {
      uploadCache.set(req.params.file, newUpload)
    }

    return { 'code': 200, 'status': 'Success' }
  }
}

// ---------------- DELETE FILE ---------------- //

async function deleteFile(req, type) {
  if (req.params.file == null) return { 'code': 400, 'status': 'No File ID Provided' }
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  if (validObject(req.params.file) == false) return { 'code': 400, 'status': 'Invalid File ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  if (type == 'team') {
    const cached = teamUploadCache.get(req.params.file)

    let upload
    if (cached) {
      upload = cached
    } else {
      upload = await teamUploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
    }

    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }

    const team = await teamSchema.findOne({ '_id': upload.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })

    if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }

    function isMember(member, index, array) {
      return member == user
    }

    if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

    await teamUploadSchema.findOneAndDelete({ '_id': req.params.file }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    })

    const s3Delete = await deleteObject(upload, 'team')
    if (s3Delete == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    if (cached) {
      teamUploadCache.del(req.params.file)
    }

    return { 'code': 200, 'status': 'Success' }
  }

  if (type == 'user') {
    const cached = uploadCache.get(req.params.file)

    let upload
    if (cached) {
      upload = cached
    } else {
      upload = await uploadSchema.findOne({ '_id': req.params.file }, (err, success) => {
        if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
      })
    }

    if (!upload) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    if (upload.user != user) return { 'code': 403, 'status': 'Access Denied' }

    await uploadSchema.findOneAndDelete({ '_id': req.params.file }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch File From Database' }
    })

    const s3Delete = await deleteObject(upload, 'user')
    if (s3Delete == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

    if (cached) {
      uploadCache.del(req.params.file)
    }

    return { 'code': 200, 'status': 'Success' }
  }
}

// ---------------- DELETE USER ---------------- //

async function deleteUser(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const teams = await teamSchema.countDocuments({ 'members.id': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Teams From Database' }
  })

  if (teams > 0) return { 'code': 400, 'status': 'Need To Delete Teams' } 

  const s3DirectoryClear = await emptyDirectory(user)
  if (s3DirectoryClear == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

  await uploadSchema.deleteMany({ 'user': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Delete Files From Database' }
  })

  await userSchema.findOneAndDelete({ '_id': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Delete User' }
  })

  const cached = userCache.get(encodeURIComponent(req.query.token))

  if (cached) {
    userCache.del(encodeURIComponent(req.query.token))
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- USER DATA ---------------- //

async function userData(req) {
  const cached = userDataCache.get(user)

  if (cached) return cached

  if (req.query.token == null) return { 'code': 400, 'status': 'No Token Provided' }

  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const userDetails = await userSchema.findOne({ '_id': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch User From Database' }
  })

  const files = await uploadSchema.find({ 'user': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Files From Database' }
  })

  if (!files) return { 'code': 400, 'status': 'Failed To Fetch Files From Database' }

  const data = {
    'user': userDetails,
    'files': files
  }

  userDataCache.set(user, data)

  return { 'code': 200, 'status': data }
}

// ---------------- CREATE TEAM ---------------- //

async function createTeam(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (!req.body.name) return { 'code': 400, 'status': 'Missing Team Name' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const teams = await teamSchema.countDocuments({ 'owner': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Teams From Database' }
  })

  if (teams >= config.teamLimit) return { 'code': 400, 'status': 'Team Limit Reached' }

  const teamName = req.body.name.replace(/[^a-zA-Z 0-9]/g, '')

  const team = new teamSchema({
    name: teamName,
    owner: user,
    members: [user]
  })

  team.save(function (err) {
    if (err) return { 'code': 400, 'status': 'Failed To Save Team' }
  })

  teamCache.set(team._id, team)

  const data = {
    'name': team.name,
    'id': team._id,
    'owner': team.owner,
    'members': team.members
  }

  return { 'code': 200, 'status': data }
}

// ---------------- RENAME TEAM ---------------- //

async function renameTeam(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (!req.body.name) return { 'code': 400, 'status': 'Missing New Name' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
  if (team.owner != user) return { 'code': 403, 'status': 'Access Denied' }

  const newName = req.body.name.replace(/[^a-zA-Z 0-9]/g, '')

  const newTeam = await teamSchema.findOneAndUpdate({ '_id': req.params.team }, { 'name': newName }, { returnOriginal: false }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
  })

  if (cached) {
    teamCache.del(req.params.team)
    teamCache.set(req.params.team, newTeam)
  } else {
    teamCache.set(req.params.team, newTeam)
  }
  
  return { 'code': 200, 'status': 'Success' }
}

// ---------------- TRANSFER TEAM ---------------- //

async function transferTeam(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.owner == null) return { 'code': 400, 'status': 'Missing New Owner' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  if (validDiscord(req.params.owner) == false) return { 'code': 400, 'status': 'Invalid Owner ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  if (team.owner != user) return { 'code': 403, 'status': 'Access Denied' }

  function isMember(member, index, array) {
    return member == req.params.owner
  }

  if (team.members.some(isMember) == false) return { 'code': 400, 'status': 'New Owner Has To Be A Member' }

  const newTeam = await teamSchema.findOneAndUpdate({ '_id': req.params.team }, { 'owner': req.params.owner }, { returnOriginal: false }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  })

  if (cached) {
    teamCache.del(req.params.team)
    teamCache.set(req.params.team, newTeam)
  } else {
    teamCache.set(req.params.team, newTeam)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- LEAVE TEAM ---------------- //

async function leaveTeam(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }

  function isMember(member, index, array) {
    return member == user
  }

  if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }
  if (user == team.owner) return { 'code': 400, 'status': 'Cannot Remove Team Owner' }

  const newTeam = await teamSchema.findOneAndUpdate({ '_id': req.params.team }, { '$pull': { 'members': { 'id': user } }}, { safe: true, multi: true, returnOriginal: false }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  })

  if (cached) {
    teamCache.del(req.params.team)
    teamCache.set(req.params.team, newTeam)
  } else {
    teamCache.set(req.params.team, newTeam)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- DELETE TEAM ---------------- //

async function deleteTeam(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  if (user != team.owner) return { 'code': 403, 'status': 'Access Denied' }

  const s3DirectoryClear = await emptyDirectory(`teams/${req.params.team}`)
  if (s3DirectoryClear == false) return { 'code': 400, 'status': 'Failed Connecting To Storage' }

  await teamUploadSchema.deleteMany({ 'team': req.params.team }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Delete Files' }
  })

  await teamSchema.findOneAndDelete({ '_id': req.params.team }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Delete Team' }
  })

  if (cached) {
    teamCache.del(req.params.team)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- ADD MEMBER ---------------- //

async function addMember(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (!req.params.member) return { 'code': 400, 'status': 'Missing Member ID' }
  if (validDiscord(req.params.member) == false) return { 'code': 400, 'status': 'Invalid User ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }

  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  if (user != team.owner) return { 'code': 403, 'status': 'Access Denied' }

  function isMember(member, index, array) {
    return member == req.params.member
  }

  if (team.members.some(isMember)) return { 'code': 400, 'status': 'Invalid Member' }

  if (team.members.length >= config.teamMemberLimit) return { 'code': 400, 'status': 'Team Member Limit Reached' }

  const newTeam = await teamSchema.findOneAndUpdate({ '_id': req.params.team }, { '$push': { 'members': req.params.member }}, { returnOriginal: false }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Add Member' }
  })

  if (cached) {
    teamCache.del(req.params.team)
    teamCache.set(req.params.team, newTeam)
  } else {
    teamCache.set(req.params.team, newTeam)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- REMOVE MEMBER ---------------- //

async function removeMember(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (!req.params.member) return { 'code': 400, 'status': 'Missing Member ID' }
  if (validDiscord(req.params.member) == false) return { 'code': 400, 'status': 'Invalid User ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }

  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }
  if (user != team.owner) return { 'code': 403, 'status': 'Access Denied' }

  function isMember(member, index, array) {
    return member == req.params.member
  }

  if (team.members.some(isMember) == false) return { 'code': 400, 'status': 'Invalid Member' }

  const newTeam = await teamSchema.findOneAndUpdate({ '_id': req.params.team }, { '$pull': { 'members': req.params.member }}, { safe: true, multi: true, returnOriginal: false }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Remove Member' }
  })

  if (cached) {
    teamCache.del(req.params.team)
    teamCache.set(req.params.team, newTeam)
  } else {
    teamCache.set(req.params.team, newTeam)
  }

  return { 'code': 200, 'status': 'Success' }
}

// ---------------- USER FILES ---------------- //

async function userFiles(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const files = await uploadSchema.find({ 'user': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Files' }
  })

  if (!files) return { 'code': 400, 'status': 'Failed To Fetch Files' }
  if (files.length == 0) return { 'code': 404, 'status': 'No Files Found' }

  return { 'code': 200, 'status': files }
}

// ---------------- USER TEAMS ---------------- //

async function userTeams(req) {
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const teams = await teamSchema.find({ 'members': user }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Teams' }
  })

  if (!teams) return { 'code': 400, 'status': 'Failed To Fetch Teams' }
  if (teams.length == 0) return { 'code': 404, 'status': 'No Teams Found' }

  return { 'code': 200, 'status': teams }
}

// ---------------- TEAM DETAILS ---------------- //

async function team(req) {
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }

  const data = {
    'name': team.name,
    'id': team.id,
    'owner': team.owner,
    'createdAt': team.createdAt,
    'updatedAt': team.updatedAt
  }

  return { 'code': 200, 'status': data }
}

// ---------------- TEAM FILES ---------------- //

async function teamFiles(req) {
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }

  function isMember(member, index, array) {
    return member == user
  }

  if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

  const files = await teamUploadSchema.find({ 'team': req.params.team }, (err, success) => {
    if (err) return { 'code': 400, 'status': 'Failed To Fetch Uploads' }
  })

  return { 'code': 200, 'status': files }
}

// ---------------- TEAM MEMBERS ---------------- //

async function teamMembers(req) {
  if (req.params.team == null) return { 'code': 400, 'status': 'Missing Team ID' }
  if (req.query.token == null) return { 'code': 400, 'status': 'Missing Token' }
  if (validObject(req.params.team) == false) return { 'code': 400, 'status': 'Invalid Team ID' }
  const user = await userID(req)
  if (user == false) return { 'code': 400, 'status': 'Failed To Authorize User' }

  const cached = teamCache.get(req.params.team)

  let team
  if (cached) {
    team = cached
  } else {
    team = await teamSchema.findOne({ '_id': req.params.team }, (err, success) => {
      if (err) return { 'code': 400, 'status': 'Failed To Fetch Team From Database' }
    })
  }

  if (!team) return { 'code': 400, 'status': 'Failed To Fetch Team' }

  function isMember(member, index, array) {
    return member == user
  }

  if (team.members.some(isMember) == false) return { 'code': 403, 'status': 'Access Denied' }

  return { 'code': 200, 'status': team.members }
}

// ---------------- ABOUT THE PRODUCT ---------------- //

async function about() {
  const cached = serviceCache.get('about')

  if (cached) return { 'code': 200, 'status': cached }

  const users = await userSchema.countDocuments(( err, success ) => {
    if (err) return { 'code': 400, 'status': 'Failed To Count Users' }
  })

  const accountlessFiles = await accountlessUploadSchema.find({}, ( err, success ) => {
    if (err) return { 'code': 400, 'status': 'Failed To Count Accountless Uploads' }
  })

  const teams = await teamSchema.countDocuments(( err, success ) => {
    if (err) return { 'code': 400, 'status': 'Failed To Count Teams' }
  })

  const files = await uploadSchema.find({}, ( err, success ) => {
    if (err) return { 'code': 400, 'status': 'Failed To Count Uploads' }
  })

  const teamFiles = await teamUploadSchema.find({}, ( err, success ) => {
    if (err) return { 'code': 400, 'status': 'Failed To Count Team Uploads' }
  })

  if (users == null || accountlessFiles == null || teams == null || files == null || teamFiles == null) return { 'code': 400, 'status': 'Failed To Fetch Data' }

  const allFiles = files.length + accountlessFiles.length + teamFiles.length

  const userFilesSize = files.reduce((acc, obj) => acc + parseInt(obj.size), 0)
  const accountlessFilesSize = accountlessFiles.reduce((acc, obj) => acc + parseInt(obj.size), 0)
  const teamFilesSize = teamFiles.reduce((acc, obj) => acc + parseInt(obj.size), 0)

  const storage = userFilesSize + accountlessFilesSize + teamFilesSize

  const data = {
    'version': config.version,
    'users': users,
    'teams': teams,
    'files': allFiles,
    'staffMembers': config.staffMembers,
    'primeMembers': 0,
    'storage': storage,
    'readableStorage': readableSize(storage),
    'fetchedAt': Date.now(),
  }

  serviceCache.set('about', data)

  return { 'code': 200, 'status': data }
}

/******************************** EXPORT FUNCTIONS ********************************/

module.exports = {
  teamMembers,
  teamFiles,
  team,
  userTeams,
  userFiles,
  toggleFavorite,
  toggleArchived,
  toggleTrashed,
  shortLink,
  cloneFile,
  uploadFile,
  getFile,
  renameFile,
  deleteFile,
  deleteUser,
  userData,
  createTeam,
  renameTeam,
  transferTeam,
  deleteTeam,
  addMember,
  removeMember,
  about,
  leaveTeam,
  dashUser,
  dashDiscordUser,
  dashFiles,
  dashTeam,
  dashTeams
}