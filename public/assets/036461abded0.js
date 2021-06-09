// -------------------------------- initialize aos -------------------------------- //

AOS.init()

// -------------------------------- console warning -------------------------------- //

console.log('%cHold Up!', 'color: #5865F2; font-size: 56px')
console.log('%cIf someone told you to copy/paste something here you have an 11/10 chance you\'re being scammed.', 'color: #72767D; font-size: 20px')

// -------------------------------- cookie notice -------------------------------- //

const cookieNotice = Cookies.get('cookie-notice')
if (cookieNotice == null) {
  Cookies.set('cookie-notice', 1, { expires: 999999, secure: true, sameSite: 'strict' })
  document.querySelector('.cookieNotice-xrj9n7').style.display = 'block'
}

document.querySelector('.times-c1m9tu').addEventListener('click', function() {
  document.querySelector('.cookieNotice-xrj9n7').style.display = 'none'
})

// -------------------------------- copy value -------------------------------- //

function copy(value) {
  const copyInput = document.createElement('input')
  copyInput.style = 'position: absolute; left: -1000px; top: -1000px'
  copyInput.value = value
  document.body.appendChild(copyInput)
  copyInput.select()
  document.execCommand('copy')
  document.body.removeChild(copyInput)
}

// -------------------------------- view section -------------------------------- //

function viewSection(name) {
  document.getElementById(name).scrollIntoView()
}

// -------------------------------- custom typeface -------------------------------- //

const activeFont = Cookies.get('font')
if (activeFont != null) {
  document.querySelector('body').classList.add(activeFont)
  if (document.querySelector('.activeTypeface-coo1pw')) {
    document.querySelector('.activeTypeface-coo1pw').innerHTML = activeFont.replace(/-/g, ' ')
  }
}

const accentColor = Cookies.get('accentColor')
if (accentColor != null) {
  document.querySelector('body').classList.add(accentColor)
  if (document.querySelector('.activeAccentColor-amipma')) {
    document.querySelector('.activeAccentColor-amipma').innerHTML = accentColor
  }
}

function setTypeface(font) {
  document.querySelector('body').className = ''
  Cookies.set('font', font, { expires: 999999, secure: true, sameSite: 'strict' })
  document.querySelector('body').classList.add(font)
  if (document.querySelector('.activeTypeface-coo1pw')) {
    document.querySelector('.activeTypeface-coo1pw').innerHTML = font.replace(/-/g, ' ')
  }
  const color = Cookies.get('accentColor')
  if (color != null) {
    document.querySelector('body').classList.add(color)
  }
}

function setAccentColor(color) {
  document.querySelector('body').className = ''
  Cookies.set('accentColor', color, { expires: 999999, secure: true, sameSite: 'strict' })
  document.querySelector('body').classList.add(color)
  const font = Cookies.get('font')
  if (font != null) {
    document.querySelector('body').classList.add(font)
  }
  if (document.querySelector('.activeAccentColor-amipma')) {
    document.querySelector('.activeAccentColor-amipma').innerHTML = color
  }
}

// -------------------------------- dot format -------------------------------- //

if (!Number.prototype.dotFormat){
  Number.prototype.dotFormat = function() {
    return this.toString().replace(/\B(?=(\d{3});+(?!\d))/g, '.')
  }
}

// -------------------------------- readable size -------------------------------- //

function readableSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// -------------------------------- mobile navigation -------------------------------- //

if (document.querySelector('.showPopup-e9fypy')) {
  document.querySelector('.showPopup-e9fypy').addEventListener('click', function() {
    document.querySelector('.mobilePopup-bgaqvw').style.display = 'block'
  })
}

if (document.querySelector('.times-gbkon9')) {
  document.querySelector('.times-gbkon9').addEventListener('click', function() {
    document.querySelector('.mobilePopup-bgaqvw').style.display = 'none'
  })
}

// -------------------------------- api handler -------------------------------- //

function fail(status, message) {
  document.querySelector('.errorStatus-mj9pbb').innerHTML = status
  document.querySelector('.errorMessage-99n0bl').innerHTML = message
  document.querySelector('.errorMessage-99n0bl').classList.add('fadeUp-s2qoe0')

  document.querySelector('.errorBox-x7i97m').style.display = 'flex'

  setTimeout(function() {
    document.querySelector('.errorMessage-99n0bl').classList.remove('fadeUp-s2qoe0')
    document.querySelector('.errorBox-x7i97m').style.display = 'none'
  }, 3000)
}

const base = '/api/'
const token = Cookies.get('token')
const api = {
  delete(url, callback) {
    if (token == null || token == 'undefined' || token == '') return fail(400, 'Cannot Find Token')
    fetch(`${base}${url}?token=${token}`, { method: 'DELETE' })
    .then((response) => {
      if (response.status == 200) {
        response.json().then((data) => { if (callback) callback(data) })
      } else {
        response.json().then((data) => { fail(response.status, data) })
      }
    })
  },

  get(url, callback) {
    if (token == null || token == 'undefined' || token == '') return fail(400, 'Cannot Find Token')
    fetch(`${base}${url}?token=${token}`, { method: 'GET' })
    .then((response) => {
      if (response.status == 200) {
        response.json().then((data) => { if (callback) callback(data) })
      } else {
        response.json().then((data) => { fail(response.status, data) })
      }
    })
  },

  put(url, callback) {
    if (token == null || token == 'undefined' || token == '') return fail(400, 'Cannot Find Token')
    fetch(`${base}${url}?token=${token}`, { method: 'PUT' })
    .then((response) => {
      if (response.status == 200) {
        response.json().then((data) => { if (callback) callback(data) })
      } else {
        response.json().then((data) => { fail(response.status, data) })
      }
    })
  },

  post(url, formData, callback) {
    if (token == null || token == 'undefined' || token == '') return fail(400, 'Cannot Find Token')
    fetch(`${base}${url}?token=${token}`, { method: 'POST', body: formData })
    .then((response) => {
      if (response.status == 200) {
        response.json().then((data) => { if (callback) callback(data) })
      } else {
        response.json().then((data) => { fail(response.status, data) })
      }
    })
  }
} 

// -------------------------------- get icon -------------------------------- //

function icon(type) {
  let icon

  if (type == '.zip' || type == 'rar') {
    icon = 'fa-file-archive'
  } else if (type == '.html' || type == '.css' || type == '.ejs' || type == '.js' || type == '.py' || type == '.json') {
    icon = 'fa-file-code'
  } else if (type == '.png' || type == '.jpg' || type == '.jpeg' || type == '.gif' || type == '.svg' || type == '.psd') {
    icon = 'fa-file-image'
  } else if (type == '.mp3' || type == '.wav') {
    icon = 'fa-file-music'
  } else if (type == '.mp4') {
    icon = 'fa-file-video'
  } else if (type == '.docx' || type == '.pdf') {
    icon = 'fa-file-alt'
  } else {
    icon = 'fa-file'
  }

  return icon
}

// -------------------------------- general configuration -------------------------------- //

// toggle list view
if (document.querySelectorAll('.toggle-9gexqa')) {
  document.querySelectorAll('.toggle-9gexqa').forEach((toggle) => {
    toggle.addEventListener('click', function() {
      document.querySelector('.wrapper-40j482').classList.toggle('list-uu8vbx')
    })
  })
}

// toggle favorites
if (document.querySelectorAll('.toggle-dyc114')) {
  document.querySelectorAll('.toggle-dyc114').forEach((toggle) => {
    toggle.addEventListener('click', function() {
      document.querySelector('.wrapper-40j482').classList.toggle('showOnlyFavorites-y5ty3b')
    })
  })
}

// open file input
if (document.querySelector('.uploadNewFile-j3xij5')) {
  document.querySelector('.uploadNewFile-j3xij5').addEventListener('click', function() {
    document.getElementById('file').click()
  })
}

// -------------------------------- upload area -------------------------------- //

if (document.querySelector('.uploadBox-br9x2l')) {
  document.querySelector('.uploadBox-br9x2l').addEventListener('click', function() {
    document.querySelector('.fileInput-k5a2gy').click()
  })
}

if (document.querySelector('.fileInput-k5a2gy')) {
  document.querySelector('.fileInput-k5a2gy').addEventListener('change', function() {
    if (document.querySelector('.fileInput-k5a2gy').files[0].size < 25*1024*1024) {
      const formData = new FormData()
      formData.append('upload', document.querySelector('.fileInput-k5a2gy').files[0])
    
      api.post('accountless/files/new', formData, (res) => {
        document.querySelector('.uploadBox-br9x2l').style.display = 'none'
        document.querySelector('.successBox-gc64cf').style.display = 'flex'
  
        document.querySelector('.fileName-bvt5y8').innerHTML = res.name
        document.querySelector('.fileType-s9l4li').innerHTML = res.type
    
        document.querySelector('.copyLink-zpswcu').addEventListener('click', function() {
          copy(res.url)
        })
      })
    } else {
      fail(400, 'File Has To Be Smaller Than 25 MB')
    }
  })
}

// -------------------------------- statistics page -------------------------------- //

if (document.querySelector('.statistics-y4gosr')) {
  const cachedStatistics = Cookies.get('stats-v2')
  
  if (cachedStatistics) {
    const statistics = JSON.parse(cachedStatistics)
    const date = Date.now()
    const time = date - cachedStatistics.fetchedAt

    if (time <= 60*60*1000) {
      api.get('/service/statistics', (res) => {
        document.querySelector('.users-n65t14').innerHTML = res.users
        document.querySelector('.teams-9bt3d9').innerHTML = res.teams
        document.querySelector('.uploads-c4zynu').innerHTML = res.files
        document.querySelector('.teamUploads-jnvnxq').innerHTML = res.accountlessFiles
        document.querySelector('.accountlessUploads-3vgac2').innerHTML = res.teamFiles
        document.querySelector('.discordMembers-i622p1').innerHTML = res.discordMembers

        Cookies.remove('stats-v2')
        Cookies.set('stats-v2', JSON.stringify(res), { expires: 999999, secure: true, sameSite: 'strict' })
      })
    } else {
      document.querySelector('.users-n65t14').innerHTML = statistics.users
      document.querySelector('.teams-9bt3d9').innerHTML = statistics.teams
      document.querySelector('.uploads-c4zynu').innerHTML = statistics.files
      document.querySelector('.teamUploads-jnvnxq').innerHTML = statistics.accountlessFiles
      document.querySelector('.accountlessUploads-3vgac2').innerHTML = statistics.teamFiles
      document.querySelector('.discordMembers-i622p1').innerHTML = statistics.discordMembers
    }
  } else {
    api.get('/service/statistics', (res) => {
      document.querySelector('.users-n65t14').innerHTML = res.users
      document.querySelector('.teams-9bt3d9').innerHTML = res.teams
      document.querySelector('.uploads-c4zynu').innerHTML = res.files
      document.querySelector('.teamUploads-jnvnxq').innerHTML = res.accountlessFiles
      document.querySelector('.accountlessUploads-3vgac2').innerHTML = res.teamFiles
      document.querySelector('.discordMembers-i622p1').innerHTML = res.discordMembers

      Cookies.set('stats-v2', JSON.stringify(res), { expires: 999999, secure: true, sameSite: 'strict' })
    })
  }
}

// -------------------------------- user requests -------------------------------- //

// trash a file
function userTrashFile(file) {
  api.put(`users/files/${file}/status/trashed/toggle`, (res) => {
    location.reload()
  })
}

// toggle archive file
function userToggleArchive(file) {
  api.put(`users/files/${file}/status/archived/toggle`, (res) => {
    location.reload()
  })
}

// toggle favorite file
function userToggleFavorite(file) {
  api.put(`users/files/${file}/status/favorite/toggle`, (res) => {
    location.reload()
  })
}

// clone a file
function userCreateClone(file) {
  api.put(`users/files/${file}/clone`, (res) => {
    location.reload()
  })
}

// get short link for a file
function userShortLink(file) {
  api.get(`users/files/${file}/short`, (res) => {
    copy(res)
  })
}

// get user data
if (document.querySelector('.userData-jej4ui')) {
  document.querySelector('.userData-jej4ui').addEventListener('click', function() {
    window.open(`/api/users/data?token=${token}`)
  })
}

// view file details
function userViewDetails(file) {
  api.get(`users/files/${file}`, (res) => {
    document.querySelector('.name-1bkjmc').innerHTML = `<span>${res.name}</span><b>${res.type}</b>`
    document.querySelector('.fileIcon-e2r17e').classList.add(icon(res.icon))
    document.querySelector('.type-2yry80').innerHTML = res.type.replace(/[.]/gui, '').toUpperCase()
    document.querySelector('.size-8ri1y3').innerHTML = `${res.readableSize} (${res.size} Bytes)`
    document.querySelector('.uploaded-s6xal2').innerHTML = dayjs(res.uploadedAt).format('MMMM D, YYYY HH:mm')
    document.querySelector('.updated-n7lr6x').innerHTML = dayjs(res.updatedAt).format('MMMM D, YYYY HH:mm')
    document.querySelector('.spinnerWrapper-8dg92z').style.display = 'none'
    document.querySelector('.detailsInner-tsf68a').style.display = 'block'
    document.querySelector('.fileDetails-635g7v').style.display = 'block'
  })
}

if (document.querySelector('.times-alcb2d')) {
  document.querySelector('.times-alcb2d').addEventListener('click', function() {
    document.querySelector('.fileDetails-635g7v').style.display = 'none'
    document.querySelector('.detailsInner-tsf68a').style.display = 'none'
    document.querySelector('.spinnerWrapper-8dg92z').style.display = 'block'
  })
}

function userShare(file) {
  document.querySelector('.sharePopup-v1helu').style.display = 'block'

  document.querySelector('.share-1e3h7u').addEventListener('click', () => {
    copy(`https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-z205mu').addEventListener('click', () => {
    window.open(`mailto:your@friend.com&body=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-9fwn4q').addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer.php?u=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-kjel94').addEventListener('click', () => {
    window.open(`https://share.flipboard.com/bookmarklet/popout?v=2&url=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-f4glxl').addEventListener('click', () => {
    window.open(`https://vk.com/share.php?url=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-c9lf1i').addEventListener('click', () => {
    window.open(`https://wa.me/?text=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-iy0ox5').addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?url=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-era4xv').addEventListener('click', () => {
    window.open(`https://www.reddit.com/submit?url=https://azury.gg/u/${file}`)
  })

  document.querySelector('.share-js7r5b').addEventListener('click', () => {
    window.open(`https://telegram.me/share/url?url=https://azury.gg/u/${file}`)
  })
}

function deleteUserWarning() {
  document.querySelector('.deleteUserPopup-s8jdp4').style.display = 'block'
}

function deleteUser() {
  api.delete('users/delete', (res) => {
    Cookies.remove('token')
    window.location.href = '/logout'
  })
}

function userDeleteFile(file) {
  api.delete(`users/files/${file}/delete`, (res) => {
    location.reload()
  })
}

if (document.querySelectorAll('.times-cg1xkr')) {
  document.querySelectorAll('.times-cg1xkr').forEach((element) => {
    element.addEventListener('click', function() {
      document.querySelectorAll('.popup-het172').forEach((popup) => {
        popup.style.display = 'none'
      })
    })
  })
}

// -------------------------------- rename file -------------------------------- //

function teamRename(id) {
  document.querySelector('.renamePopup-c3nto9').style.display = 'block'
  document.getElementById('newFileName').setAttribute('data-type', 'team')
  document.getElementById('newFileName').setAttribute('data-file', id)
}

function userRename(id) {
  document.querySelector('.renamePopup-c3nto9').style.display = 'block'
  document.getElementById('newFileName').setAttribute('data-type', 'user')
  document.getElementById('newFileName').setAttribute('data-file', id)
}

if (document.getElementById('renameFileSubmit')) {
  document.getElementById('renameFileSubmit').addEventListener('click', function() {
    const type = document.getElementById('newFileName').getAttribute('data-type')
    const file = document.getElementById('newFileName').getAttribute('data-file')

    if (type == 'user') {
      const formData = new FormData()
      formData.append('name', document.getElementById('newFileName').value)

      api.post(`users/files/${file}/rename`, formData, (res) => {
        location.reload()
      })
    } else {
      const formData = new FormData()
      formData.append('name', document.getElementById('newFileName').value)

      api.post(`teams/files/${file}/rename`, formData, (res) => {
        location.reload()
      })
    }
  }) 
}

// -------------------------------- rename team -------------------------------- //

function renameTeam(team) {
  document.querySelector('.renameTeamPopup-sewzbh').style.display = 'block'
  document.querySelector('.newTeamName-80a7d5').setAttribute('data-team', team)
}

if (document.querySelector('.renameTeam-t6cw0j')) {
  document.querySelector('.renameTeam-t6cw0j').addEventListener('click', function() {
    const team = document.querySelector('.newTeamName-80a7d5').getAttribute('data-team')

    const formData = new FormData()
    formData.append('name', document.getElementById('newTeamName').value)

    api.post(`teams/${team}/rename`, formData, (res) => {
      location.reload()
    })
  })
}

// -------------------------------- transfer team -------------------------------- //

function transferTeam(team) {
  document.querySelector('.transferTeamPopup-dbca38').style.display = 'block'
  document.getElementById('newOwner').setAttribute('data-team', team)
}

if (document.querySelector('.transferTeam-jfhyne')) {
  document.querySelector('.transferTeam-jfhyne').addEventListener('click', function() {
    const team = document.getElementById('newOwner').getAttribute('data-team')
    const newOwner = document.getElementById('newOwner').value

    api.put(`teams/${team}/transfer/${newOwner}`, (res) => {
      location.reload()
    })
  })
}

// -------------------------------- add user -------------------------------- //

function addUserToTeam(team) {
  document.querySelector('.addUserPopup-7ia9gh').style.display = 'block'
  document.querySelector('.newMember-hjx3y8').setAttribute('data-team', team)
}

if (document.querySelector('.addUser-24em0z')) {
  document.querySelector('.addUser-24em0z').addEventListener('click', function() {
    const team = document.querySelector('.newMember-hjx3y8').getAttribute('data-team')
    const newMember = document.querySelector('.newMember-hjx3y8').value

    api.put(`teams/${team}/members/add/${newMember}`, (res) => {
      location.reload()
    })
  })
}

// -------------------------------- upload -------------------------------- //

if (document.querySelector('.input-qzb607')) {
  document.querySelector('.input-qzb607').addEventListener('change', function() {
    const fileName = document.querySelector('.input-qzb607').value.split('\\').pop()
    const name = fileName.split('.').slice(0, -1).join('.')
    const extension = fileName.split('.').pop()
    const size = this.files[0].size
  
    document.querySelector('.fileName-72ber3').innerHTML = `<span>${name}</span><small>.${extension}</small>`
    document.querySelector('.fileSize-62xwoc').innerHTML = readableSize(size)
    document.querySelector('.uploadPopup-sb7chb').style.display = 'block'
  })
}

if (document.querySelector('.submitUpload-kb5qqb') && document.querySelector('.input-qzb607')) {
  const upload = document.querySelector('.input-qzb607').getAttribute('data-upload')

  document.querySelector('.submitUpload-kb5qqb').addEventListener('click', function() {
    if (document.querySelector('.input-qzb607').files[0].size < 100*1024*1024) {
      if (upload == 'team') {
        const team = document.querySelector('.input-qzb607').getAttribute('data-team')
  
        const formData = new FormData()
        formData.append('upload', document.querySelector('.input-qzb607').files[0])
  
        api.post(`teams/${team}/files/new`, formData, (res) => {
          location.reload()
        })
      } else {
        const formData = new FormData()
        formData.append('upload', document.querySelector('.input-qzb607').files[0])
  
        api.post(`users/files/new`, formData, (res) => {
          location.reload()
        })
      }
    } else {
      fail(400, 'You can only upload files up to 100 MB.')
    }
  })
}

// -------------------------------- team requests -------------------------------- //

function teamShortLink(file) {
  api.get(`teams/files/${file}/short`, (res) => {
    copy(res)
  })
}

function teamLeave(team) {
  api.put(`teams/${team}/leave`, (res) => {
    window.location.href = '/inventory'
  })
}

function search() {
  const input = document.getElementById('searchbar').value
  document.querySelectorAll('.item-96xnxf > .title-ojp0kq > h1').forEach(e=>e.textContent.toLowerCase().includes(input.toLowerCase())?e.parentElement.parentElement.removeAttribute('hidden'):e.parentElement.parentElement.setAttribute('hidden',''))
}

function teamCreateClone(file) {
  api.put(`teams/files/${file}/clone`, (res) => {
    location.reload()
  })
}

if (document.getElementById('addMemberSubmit')) {
  document.getElementById('addMemberSubmit').addEventListener('click', function() {
    const member = document.getElementById('memberAddInput').value 
    const team = document.getElementById('memberAddInput').getAttribute('team')
  
    api.put(`teams/${team}/members/add/${member}`, (res) => {
      window.location.href = `/team/${team}`
    })
  })
}

function deleteTeam(team) {
  api.delete(`teams/${team}/delete`, (res) => {
    window.location.href = '/inventory'
  })
}

function kickUser(team, user) {
  api.put(`teams/${team}/members/remove/${user}`, (res) => {
    window.location.href = `/team/${team}`
  })
}

// share a file
function teamShare(file) {
  document.querySelector('.sharePopup-v1helu').style.display = 'block'

  document.querySelector('.share-1e3h7u').addEventListener('click', () => {
    copy(`https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-z205mu').addEventListener('click', () => {
    window.open(`mailto:your@friend.com&body=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-9fwn4q').addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer.php?u=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-kjel94').addEventListener('click', () => {
    window.open(`https://share.flipboard.com/bookmarklet/popout?v=2&url=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-f4glxl').addEventListener('click', () => {
    window.open(`https://vk.com/share.php?url=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-c9lf1i').addEventListener('click', () => {
    window.open(`https://wa.me/?text=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-iy0ox5').addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?url=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-era4xv').addEventListener('click', () => {
    window.open(`https://www.reddit.com/submit?url=https://azury.gg/t/${file}`)
  })

  document.querySelector('.share-js7r5b').addEventListener('click', () => {
    window.open(`https://telegram.me/share/url?url=https://azury.gg/t/${file}`)
  })
}

function teamDeleteFile(file) {
  api.delete(`teams/files/${file}/delete`, (res) => {
    location.reload()
  })
}

// view file details
function teamViewDetails(file) {
  api.get(`teams/files/${file}`, (res) => {
    document.querySelector('.name-1bkjmc').innerHTML = `<span>${res.name}</span><b>${res.type}</b>`
    document.querySelector('.fileIcon-e2r17e').classList.add(icon(res.icon))
    document.querySelector('.type-2yry80').innerHTML = res.type.replace(/[.]/gui, '').toUpperCase()
    document.querySelector('.size-8ri1y3').innerHTML = `${res.readableSize} (${res.size} Bytes)`
    document.querySelector('.uploaded-s6xal2').innerHTML = dayjs(res.uploadedAt).format('MMMM D, YYYY HH:mm')
    document.querySelector('.updated-n7lr6x').innerHTML = dayjs(res.updatedAt).format('MMMM D, YYYY HH:mm')
    document.querySelector('.spinnerWrapper-8dg92z').style.display = 'none'
    document.querySelector('.detailsInner-tsf68a').style.display = 'block'
    document.querySelector('.fileDetails-635g7v').style.display = 'block'
  })
}

function createNewTeam() {
  document.querySelector('.createTeamPopup-mlwrvm').style.display = 'block'
}

if (document.querySelector('.createTeam-3xmrfp')) {
  document.querySelector('.createTeam-3xmrfp').addEventListener('click', function() {
    const formData = new FormData()
    formData.append('name', document.getElementById('createTeamName').value)
    api.post('teams/new', formData, (res) => {
      window.location.href = `/team/${res.id}`
    })
  })
}

if (document.querySelector('.showMobileMenu-evttun')) {
  document.querySelector('.showMobileMenu-evttun').addEventListener('click', function() {
    document.querySelector('.mobileMenu-vmkvxd').classList.add('menuHeight-df2589')
  })
}

if (document.querySelector('.hideMobileNavigation-avxn7l')) {
  document.querySelector('.hideMobileNavigation-avxn7l').addEventListener('click', function() {
    document.querySelector('.mobileMenu-vmkvxd').classList.remove('menuHeight-df2589')
  })
}

function anonymousShare(file) {
  document.querySelector('.sharePopup-v1helu').style.display = 'block'

  document.querySelector('.share-1e3h7u').addEventListener('click', () => {
    copy(`https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-z205mu').addEventListener('click', () => {
    window.open(`mailto:your@friend.com&body=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-9fwn4q').addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer.php?u=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-kjel94').addEventListener('click', () => {
    window.open(`https://share.flipboard.com/bookmarklet/popout?v=2&url=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-f4glxl').addEventListener('click', () => {
    window.open(`https://vk.com/share.php?url=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-c9lf1i').addEventListener('click', () => {
    window.open(`https://wa.me/?text=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-iy0ox5').addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?url=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-era4xv').addEventListener('click', () => {
    window.open(`https://www.reddit.com/submit?url=https://azury.gg/a/${file}`)
  })

  document.querySelector('.share-js7r5b').addEventListener('click', () => {
    window.open(`https://telegram.me/share/url?url=https://azury.gg/a/${file}`)
  })
}

// -------------------------------- configure tooltips -------------------------------- //

function tip (item, content, placement) {
  tippy(`.${item}`, {
    content: content,
    animation: 'scale-subtle',
    theme: 'dark',
    placement: placement,
    arrow: false
  })
}

function sidebarTip (item, content, placement) {
  tippy(`.${item}`, {
    content: content,
    animation: 'scale-subtle',
    theme: 'reallydark',
    placement: placement
  })
}

// interactive tooltip
function interactiveTip (item, object, placement) {
  const dropdown = document.getElementById(object)
  dropdown.style.display = 'block'

  tippy(`.${item}`, {
    content: dropdown,
    animation: 'scale-subtle',
    theme: 'menu',
    placement: placement,
    interactive: true,
    arrow: false,
    trigger: 'click',
    interactiveBorder: 0,
    inlinePositioning: true
  })
}

// dynamic tooltip -> useful for adding ejs variables inside the tooltip
function dynamicTip (item, interactive, placement) {
  let options

  if (interactive == true) {
    options = {
      content(reference) {
        const id = reference.getAttribute('data-template')
        const template = document.getElementById(id)
        return template.innerHTML
      },
      allowHTML: true,
      animation: 'scale-subtle',
      theme: 'menu',
      placement: placement,
      interactive: true,
      arrow: false,
      trigger: 'click',
      interactiveBorder: 0,
      inlinePositioning: true
    }
  } else {
    options = {
      content(reference) {
        const id = reference.getAttribute('data-template')
        const template = document.getElementById(id)
        return template.innerHTML
      },
      allowHTML: true,
      animation: 'scale-subtle',
      theme: 'reallydark',
      placement: placement
    }
  }

  tippy(`.${item}`, options)
}