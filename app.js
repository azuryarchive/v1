/******************************** DEPENDENCIES ********************************/

const compress = require('compression')
const config = require('./config.json')
const express = require('express')
const session = require('express-session')
const userSchema = require('./schemas/user')
const passport  = require('passport')
const expressLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const dayjs = require('dayjs')
const localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat)
const apiRouter = require('./api.js')
const app = express()
const Strategy = require('passport-discord').Strategy
const { dashUser, dashDiscordUser, getFile, dashFiles, dashTeam, dashTeams } = require('./core')

/******************************** ENVIRONMENT VARIABLES ********************************/

require('dotenv').config()
const env = process.env

/******************************** MONGODB ********************************/

mongoose.connect(env.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

/******************************** RATELIMIT ********************************/

// max. 30 req. per minute
const rateLimit = expressLimit({
  windowMs: 1 * 60 * 1000,
  max: 30
})

/******************************** EXPRESS ********************************/

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(compress())
app.use(express.json())
app.use('/api', apiRouter)
app.set('trust proxy', true)
app.use(rateLimit)
app.set('views', __dirname + '/views')
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}

/******************************** AUTHENTICATION ********************************/

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

passport.use(new Strategy({
  clientID: env.clientID,
  clientSecret: env.clientSecret,
  callbackURL: env.callbackURL,
  scope: config.scopes,
  prompt: 'none'
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function() {
    return done(null, profile)
  })
}))

app.get('/login', passport.authenticate('discord', { scope: config.scopes, prompt: 'none' }), async (req, res) => {})

app.get('/callback',
  passport.authenticate('discord', { 
    failureRedirect: '/'
  }), async (req, res) => {
    res.redirect('/inventory')
  }
)

app.get('/logout', async (req, res) => {
  req.logout()
  res.redirect('/')
})

/******************************** WEBSITE ********************************/
function user(req) {
  if (req.isAuthenticated()) return req.user
  return 'Logged Out'
}

async function page(site, req, res) {
  res.render(`pages/${site}`, { authenticated: req.isAuthenticated(), u: user(req) })
}

async function fail(error, code, req, res) {
  res.render('pages/error', { authenticated: req.isAuthenticated(), u: user(req), error: error, code: code })
}

app.get('/', async (req, res) => { page('index', req, res) })
app.get('/terms', async (req, res) => { page('terms', req, res) })
app.get('/guidelines', async (req, res) => { page('guidelines', req, res) })
app.get('/imprint', async (req, res) => { page('imprint', req, res) })
app.get('/privacy', async (req, res) => { page('privacy', req, res) })
app.get('/documentation', async (req, res) => { page('documentation', req, res) })

/******************************** DOWNLOAD PAGES ********************************/

app.get('/u/:file', async (req, res) => {
  const data = await getFile(req, 'user')

  if (data.code == '200') {
    const author = await dashDiscordUser(data.status.author)
    const user = () => {
      if (req.isAuthenticated()) return req.user
      return 'Logged Out'
    }

    res.render('pages/download', { 
      date: dayjs,
      file: data.status,
      author: author,
      authenticated: req.isAuthenticated(),
      u: user(req)
    })
  } else {
    fail(data.code, data.status, req, res)
  }
})

app.get('/a/:file', async (req, res) => {
  const data = await getFile(req, 'accountless')

  if (data.code == '200') {
    const author = 'Anonymous'
    const user = () => {
      if (req.isAuthenticated()) return req.user
      return 'Logged Out'
    }

    res.render('pages/download', { 
      date: dayjs,
      file: data.status,
      author: author,
      authenticated: req.isAuthenticated(),
      u: user(req)
    })
  } else {
    fail(data.code, data.status, req, res)
  }
})

app.get('/t/:file', async (req, res) => {
  const data = await getFile(req, 'team')

  if (data.code == '200') {
    const author = 'Team'
    const user = () => {
      if (req.isAuthenticated()) return req.user
      return 'Logged Out'
    }

    res.render('pages/download', { 
      date: dayjs,
      file: data.status,
      author: author,
      authenticated: req.isAuthenticated(),
      u: user(req)
    })
  } else {
    fail(data.code, data.status, req, res)
  }
})

/******************************** DASHBOARD ********************************/

app.get('/inventory', checkAuth, async (req, res) => {
  const count = await userSchema.countDocuments({ '_id': encodeURIComponent(req.user.id) }, (err, success) => {
    if (err) return
  })

  let files = ''
  let teams = ''
  let user
  if (count < 1) {
    user = new userSchema({
      _id: req.user.id
    })

    user.save(function (err, success) {
      if (err) return
    })
  } else {
    files = await dashFiles(req, 'all')
    user = await dashUser(req.user.id)
    teams = await dashTeams(req.user.id)
  }

  if (files === false || user === false || teams === false) {
    res.status(400).json('Failed To Fetch Data')
    console.log(files)
    console.log(user)
    console.log(teams)
  } else {
    res.render('pages/inventory', { 
      date: dayjs,
      files: files,
      u: req.user,
      teams: teams,
      user: user,
    })
  }
})

app.get('/trash', checkAuth, async (req, res) => {
  const files = await dashFiles(req, 'trash')
  const teams = await dashTeams(req.user.id)

  if (files === false || teams === false) {
    res.status(400).json('Failed To Fetch Data')
  } else {
    res.render('pages/trash', { 
      date: dayjs,
      files: files,
      u: req.user,
      teams: teams
    })
  }
})

app.get('/archive', checkAuth, async (req, res) => {
  const files = await dashFiles(req, 'archive')
  const teams = await dashTeams(req.user.id)

  if (files === false || teams === false) { 
    res.status(400).json('Failed To Fetch Data')
  } else {
    res.render('pages/archive', { 
      date: dayjs,
      u: req.user,
      teams: teams,
      files: files
    })
  }
})

/*
app.get('/account', checkAuth, async (req, res) => {
  const user = await dashUser(req.user.id)
  const teams = await dashTeams(req.user.id)

  if (user === false || teams === false) {
    res.status(400).json('Failed To Fetch Data')
  } else {
    res.render('pages/account', { 
      user: user,
      u: req.user,
      teams: teams,
      version: config.version
    })
  }

  res.redirect('/inventory')
})
*/

app.get('/dev-account', checkAuth, async (req, res) => {
  const user = await dashUser(req.user.id)
  const teams = await dashTeams(req.user.id)

  if (user === false || teams === false) {
    res.status(400).json('Failed To Fetch Data')
  } else {
    res.render('pages/account', { 
      user: user,
      u: req.user,
      teams: teams,
      version: config.version
    })
  }
})

app.get('/team/:team', checkAuth, async (req, res) => {
  const team = await dashTeam(req.params.team)
  const teams = await dashTeams(req.user.id)

  if (team === false || teams === false) {
    res.status(400).json('Failed To Fetch Data')
  } else {
    res.render('pages/team', { 
      date: dayjs,
      team: team.details,
      members: team.members,
      files: team.files,
      u: req.user,
      teams: teams
    })
  }
})

/******************************** SOCIAL ********************************/

app.get('/discord', async (req, res) => {
  res.redirect(301, config.discord)
})

app.get('/github', async (req, res) => {
  res.redirect(301, config.github)
})

app.get('/twitter', async (req, res) => {
  res.redirect(301, config.twitter)
})

app.get('/trustpilot', async (req, res) => {
  res.redirect(301, config.trustpilot)
})

app.get('/contact', async (req, res) => {
  res.redirect(301, 'mailto:support@azury.gg')
})

/******************************** NOT FOUND ********************************/

app.use(function(req, res) {
  res.status(404).render('pages/error', { authenticated: req.isAuthenticated(), u: user(req), code: 404, error: 'Not Found' })
  return
})

/******************************** START SERVER ********************************/

app.listen(env.port, function (err) {
  if (err) return console.log(err)
  console.log('App was successfully launched.')
})