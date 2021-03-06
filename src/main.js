// === DEFAULT / CUSTOM STYLE ===
// WARNING! always comment out ONE of the two require() calls below.
// 1. use next line to activate CUSTOM STYLE (./src/themes)
// require(`./themes/app.${__THEME}.styl`)
// 2. or, use next line to activate DEFAULT QUASAR STYLE
require(`quasar/dist/quasar.${__THEME}.css`)
// ==============================

import Vue from 'vue'
import Quasar from 'quasar'
import router from './router'
import apiManager from 'bts-connection'
var VueClipboard = require('vue-clipboard2')
VueClipboard.install(Vue)
Vue.use(Quasar) // Install Quasar Framework

apiManager.connect((localStorage.bts_servers||process.env.bts_servers).split(',')).then(()=>{
  Quasar.start(() => {
    /* eslint-disable no-new */
    new Vue({
      el: '#q-app',
      router,
      render: h => h(require('./App'))
    })
  })
}).catch(e=>{
  alert(e)
  location.reload()
})
