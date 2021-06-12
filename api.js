/******************************** DEPENDENCIES ********************************/

const express = require('express')
const config = require('./config.json')
const api = express.Router()
const fileUpload = require('express-fileupload')
const core = require('./core.js')
const cors = require('cors')

/******************************** CONFIGURE ROUTER ********************************/

api.use(fileUpload({
  limits: { fileSize: config.uploadLimit*1024*1024 },
  uploadTimeout: 60000
}))
api.use(cors())

/******************************** API ********************************/

// ---------------- PRODUCT ---------------- //

// get javascript library version
api.get('/product/azury.js/version', async (req, res) => {
  res.status(200).json(config.jsWrapper)
})

// get python library version
api.get('/product/azury.py/version', async (req, res) => {
  res.status(200).json(config.pyWrapper)
})

// get product statistics
api.get('/product/statistics', async (req, res) => {
  const result = await core.about()
  res.status(result.code).json(result.status)
})

// ---------------- ACCOUNTLESS ---------------- //

// upload new file
api.post('/accountless/files/new', async (req, res) => {
  const result = await core.uploadFile(req, 'accountless')
  res.status(result.code).json(result.status)
})

// get file details
api.get('/accountless/files/:file', async (req, res) => {
  const result = await core.getFile(req, 'accountless')
  res.status(result.code).json(result.status)
})

// ---------------- USERS ---------------- //

// get short link
api.get('/users/files/:file/short', async (req, res) => {
  core.shortLink(`https://azury.gg/u/${req.params.file}`, (url) => {
    res.status(200).json(url)
  })
})

// upload new file
api.post('/users/files/new', async (req, res) => {
  const result = await core.uploadFile(req, 'user')
  res.status(result.code).json(result.status)
})

// get user files
api.get('/users/files', async (req, res) => {
  const result = await core.userFiles(req)
  res.status(result.code).json(result.status)
})

// get user teams
api.get('/users/teams', async (req, res) => {
  const result = await core.userTeams(req)
  res.status(result.code).json(result.status)
})

// toggle archived status
api.put('/users/files/:file/status/archived/toggle', async (req, res) => {
  const result = await core.toggleArchived(req)
  res.status(result.code).json(result.status)
})

// toggle trashed status
api.put('/users/files/:file/status/trashed/toggle', async (req, res) => {
  const result = await core.toggleTrashed(req)
  res.status(result.code).json(result.status)
})

// toggle favorite status
api.put('/users/files/:file/status/favorite/toggle', async (req, res) => {
  const result = await core.toggleFavorite(req)
  res.status(result.code).json(result.status)
})

// clone file
api.put('/users/files/:file/clone', async (req, res) => {
  const result = await core.cloneFile(req, 'user')
  res.status(result.code).json(result.status)
})

// get file details
api.get('/users/files/:file', async (req, res) => {
  const result = await core.getFile(req, 'user')
  res.status(result.code).json(result.status)
})

// rename file
api.post('/users/files/:file/rename', async (req, res) => {
  const result = await core.renameFile(req, 'user')

  res.status(result.code).json(result.status)
})

// delete file
api.delete('/users/files/:file/delete', async (req, res) => {
  const result = await core.deleteFile(req, 'user')
  res.status(result.code).json(result.status)
})

// delete user
api.delete('/users/delete', async (req, res) => {
  const result = await core.deleteUser(req)
  res.status(result.code).json(result.status)
})

// get user data
api.get('/users/data', async (req, res) => {
  const result = await core.userData(req)
  res.status(result.code).json(result.status)
})

// ---------------- TEAMS ---------------- //

// get team
api.get('/teams/:team', async (req, res) => {
  const result = await core.team(req)
  res.status(result.code).json(result.status)
})

// get team files
api.get('/teams/:team/files', async (req, res) => {
  const result = await core.teamFiles(req)
  res.status(result.code).json(result.status)
})

// get team members
api.get('/teams/:team/members', async (req, res) => {
  const result = await core.teamMembers(req)

  res.status(result.code).json(result.status)
})

// get short link
api.get('/teams/files/:file/short', async (req, res) => {
  core.shortLink(`https://azury.gg/t/${req.params.file}`, (url) => {
    res.status(200).json(url)
  })
})

// upload new file
api.post('/teams/:team/files/new', async (req, res) => {
  const result = await core.uploadFile(req, 'team') 
  res.status(result.code).json(result.status)
})

// clone file
api.put('/teams/files/:file/clone', async (req, res) => {
  const result = await core.cloneFile(req, 'team')
  res.status(result.code).json(result.status)
})

// get file details
api.get('/teams/files/:file', async (req, res) => {
  const result = await core.getFile(req, 'team')
  res.status(result.code).json(result.status)
})

// rename file
api.post('/teams/files/:file/rename', async (req, res) => {
  const result = await core.renameFile(req, 'team')
  res.status(result.code).json(result.status)
})

// delete file
api.delete('/teams/files/:file/delete', async (req, res) => {
  const result = await core.deleteFile(req, 'team')
  res.status(result.code).json(result.status)
})

// create team
api.post('/teams/new', async (req, res) => {
  const result = await core.createTeam(req)
  res.status(result.code).json(result.status)
})

// rename team
api.post('/teams/:team/rename', async (req, res) => {
  const result = await core.renameTeam(req)
  res.status(result.code).json(result.status)
})

// transfer team
api.put('/teams/:team/transfer/:owner', async (req, res) => {
  const result = await core.transferTeam(req)
  res.status(result.code).json(result.status)
})

// leave team
api.put('/teams/:team/leave', async (req, res) => {
  const result = await core.leaveTeam(req)
  res.status(result.code).json(result.status)
})

// delete team
api.delete('/teams/:team/delete', async (req, res) => {
  const result = await core.deleteTeam(req)
  res.status(result.code).json(result.status)
})

// add member
api.put('/teams/:team/members/add/:member', async (req, res) => {
  const result = await core.addMember(req)
  res.status(result.code).json(result.status)
})

// remove member
api.put('/teams/:team/members/remove/:member', async (req, res) => {
  const result = await core.removeMember(req)
  res.status(result.code).json(result.status)
})

/******************************** SOCIAL MEDIA ********************************/

api.get('/discord', async (req, res) => {
  res.redirect(301, config.discord)
})

api.get('/gitlab', async (req, res) => {
  res.redirect(301, config.gitlab)
})

api.get('/github', async (req, res) => {
  res.redirect(301, config.github)
})

api.get('/youtube', async (req, res) => {
  res.redirect(301, config.youtube)
})

api.get('/twitter', async (req, res) => {
  res.redirect(301, config.twitter)
})

api.get('/instagram', async (req, res) => {
  res.redirect(301, config.instagram)
})

module.exports = api