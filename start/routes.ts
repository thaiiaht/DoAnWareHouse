/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AuthController from '#controllers/auth_controller'
import { middleware } from './kernel.js'
router.get('/', async ({ view, auth }) => {
    await auth.use('web').check()
    const user = auth.use('web').user
    return view.render('home', { user})
}).use(middleware.optional())

router.post('/login', [AuthController, 'login'])
router.post('/register', [AuthController, 'register'])
router.post('/logout', [AuthController, 'logout'])
