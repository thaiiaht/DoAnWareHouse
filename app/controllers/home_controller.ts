import { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import { kiotMap } from '../Helpers/kiotMap.js'

export default class HomeController {

    async store({ request, response }: HttpContext ) {
        const { kiotName, container_uid, item_type_name, quantity } = request.body()
        const CAPACITY_LIMIT = 50
        let type: 'in' | 'out' | null = null
        const KiotModel = kiotMap[kiotName as keyof typeof kiotMap]

        if (!KiotModel) {
            return response.badRequest({
                message: 'Kiot không tồn tại',
            })
        }

        const isExisted = await KiotModel
            .query()
            .where('container_uid', container_uid)
            .first()

        // Tính tổng
        const total = await KiotModel.query()
            .sum('quantity as total')

        // Lấy giá trị ra ( nếu null thì là 0)
        const totalIn = Number(total[0].$extras.total) || 0
        
        // Tồn kho thực tế
        const currentStock = totalIn

        // Tính tồn kho mới khi request
        let newStock = currentStock
        const quantityNum = Number(quantity)

        if ( !isExisted ) {
            type = "in"
            newStock = currentStock + quantityNum
            await KiotModel.create({
                kiotName,
                container_uid,
                item_type_name,
                quantity: quantityNum,
        })
        } else {
            type = "out"
            newStock = currentStock - quantityNum
            console.log(isExisted)
            await isExisted.delete()
        }

        // Check available_capacity
        // Quá (50 slots)
        if ( type === 'in' && newStock > CAPACITY_LIMIT) {
            transmit.broadcast('/kiot/updates', {
                status: 'error',
                message: `Cảnh báo: ${kiotName} đã đầy ! (Hiện có: ${currentStock}, Nhập: ${quantity} -> Vượt quá 50)`,
                kiotName: kiotName
            })
            return response.badRequest({ message: 'Kho đầy!' })
        }

        transmit.broadcast('/kiot/updates', {
            status: 'success',
            message: type === 'in' ? `Đã nhập ${quantity} vào ${kiotName}` : `Đã xuất ${quantity} khỏi ${kiotName}`,
            kiotName: kiotName,
            
            // Số liệu quan trọng để vẽ lại giao diện
            newTotal: newStock,
            newRemaining: CAPACITY_LIMIT - newStock
        })

        return response.ok({ message: 'Success', currentStock: newStock })
    }
}