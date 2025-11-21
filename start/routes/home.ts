import router from '@adonisjs/core/services/router'
import HomeController from '#controllers/home_controller'

router.post('/store', [HomeController, 'store'])