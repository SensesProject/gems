import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/:module',
      name: 'module',
      component: Home
    },
    {
      path: '/:module/:gem',
      name: 'gem',
      component: () => import(/* webpackChunkName: "gem" */ './views/Gem.vue')
    }
  ]
})
