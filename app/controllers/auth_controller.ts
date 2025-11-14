import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
    async index({ view, auth }: HttpContext) {
        await auth.use('web').check()
        const user = auth.use('web').user
        return view.render('home', { user })
    }

    async login({ auth, request, response }: HttpContext) {
    const email = request.input('email')
    const password = request.input('password')
    console.log('Login attempt:', email, password)

    try {
        const user = await User.verifyCredentials(email, password)
        await auth.use('web').login(user)
        return response.ok({ success: true })
    } catch (error) {
        console.error(error) // Log ra để biết nguyên nhân
        return response.badRequest({ 
        success: false, 
        message: error.message || 'Email hoặc mật khẩu không đúng!' 
        })
    }
    }

     // register method
    async register({ request, response }: HttpContext) {
        const { fullName, email, password } = request.only(['fullName' ,'email', 'password'])
        const existUser = await User.query().where('email', email).first()
        if (existUser) {
            return response.badRequest({ message: 'Email đã tồn tại' })
        }
            await User.create({
                fullName: fullName,
                email: email,
                password: password,
            })
            return response.ok({
                success: true,
            })
        }

    async logout({ auth, response }: HttpContext) {
        await auth.use('web').logout()
        return response.ok({
            success: true,
        })
    }
    }