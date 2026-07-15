import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'
import BoardView from '../views/BoardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'map', component: MapView },
    { path: '/board', name: 'board', component: BoardView }
  ]
})

export default router