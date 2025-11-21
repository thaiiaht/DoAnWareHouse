
import transmit from '@adonisjs/transmit/services/main'
import router from '@adonisjs/core/services/router'
import AuthController from '#controllers/auth_controller'
import { middleware } from './kernel.js'

import '#start/routes/admin'
import '#start/routes/warehouse'
import '#start/routes/home'

transmit.registerRoutes()

router.get('/', [AuthController, 'index']).use(middleware.optional())
router.post('/login', [AuthController, 'login'])
router.post('/register', [AuthController, 'register'])
router.post('/logout', [AuthController, 'logout'])
