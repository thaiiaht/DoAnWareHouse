import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { kiotMap } from '../Helpers/kiotMap.js'

export default class AuthController {
   async index({ view, auth }: HttpContext) {
        await auth.use('web').check()
        const user = auth.use('web').user

        // 1. Cấu hình danh sách kho
        const kiotConfig = [
            { key: 'kho-a', name: 'Kho A' },
            { key: 'kho-b', name: 'Kho B' },
            { key: 'kho-c', name: 'Kho C' },
            { key: 'kho-d', name: 'Kho D' },
        ]

        // 2. Chạy vòng lặp tính toán dữ liệu
        const warehouses = await Promise.all(kiotConfig.map(async (config) => {
            const Model = kiotMap[config.key as keyof typeof kiotMap]
            
            // Nếu không tìm thấy Model thì trả về dữ liệu rỗng để tránh lỗi
            if (!Model) {
                console.log(`Lỗi: Không tìm thấy Model cho ${config.key}`)
                return { id: config.key, name: config.name, capacity: 50, current: 0, remaining: 50 }
            }

            // Tính toán
            const total = await Model.query().sum('quantity as total')
            const totalIn = Number(total[0].$extras.total) || 0
            const CAPACITY = 50

            return {
                id: config.key,
                name: config.name,
                capacity: CAPACITY,
                current: totalIn,
                remaining: CAPACITY - totalIn
            }
        }))
        return view.render('home', { 
            user: user, 
            warehouses: warehouses 
        })
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