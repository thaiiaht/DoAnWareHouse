import { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import { kiotMap } from '../Helpers/kiotMap.js'

export default class HomeController {

    async store({ request, response }: HttpContext ) {
        const { kiotName, type, quantity } = request.body()
        const CAPACITY_LIMIT = 50
        const KiotModel = kiotMap[kiotName as keyof typeof kiotMap]

        if (!KiotModel) {
            return response.badRequest({
                message: 'Kiot không tồn tại',
            })
        }

        // Tính tổng nhập (IN)
        const totalInResult = await KiotModel.query()
            .where('type', 'in')
            .sum('quantity as total')

        // Tính tổng xuất 
        const totalOutResult = await KiotModel.query()
            .where('type', 'out')
            .sum('quantity as total')

        // Lấy giá trị ra ( nếu null thì là 0)
        const totalIn = Number(totalInResult[0].$extras.total) || 0
        const totalOut = Number(totalOutResult[0].$extras.total) || 0
        
        // Tồn kho thực tế
        const currentStock = totalIn - totalOut

        // Tính tồn kho mới khi request
        let newStock = currentStock
        const quantityNum = Number(quantity)

        if (type === 'in') {
            newStock = currentStock + quantityNum
        } else if (type === 'out') {
            newStock = currentStock - quantityNum
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

        await KiotModel.create({
            kiotName,
            type:type,
            quantity: quantityNum,
        })

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