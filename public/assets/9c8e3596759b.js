const emotes = [
  '(╯°□°）╯︵ ┻━┻',
  '(^_^)b',
  '\\(^Д^)/',
  '(^-^*)',
  '(;-;)',
  '(=\'X\'=)',
  '(o^^)o',
  '(>_<)',
  '(·_·)',
  '¯\\_(ツ)_/¯'
]
const randomEmote = Math.floor(Math.random()*emotes.length)

document.querySelector('.errorEmote-use4zr').innerHTML = emotes[randomEmote]