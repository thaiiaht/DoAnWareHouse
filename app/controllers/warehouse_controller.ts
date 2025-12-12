import { HttpContext } from '@adonisjs/core/http'
import DeliveryLog from '#models/delivery_log'
import transmit from '@adonisjs/transmit/services/main'
import mqttService from '#services/mqtt_service'
import { kiotMap } from '../Helpers/kiotMap.js'

export default class WarehouseController {
    async index({ view }: HttpContext) {
        const log = await DeliveryLog.query().orderBy('created_at', 'desc')
        return view.render('deliveryLogs', { log })
    }

    async arrival({ request, response }: HttpContext) {
        const { kiot } = request.body()
        const payload = {
        title: 'Xe hàng đang đến!',
        message: `Xe hàng đang tới ${kiot}. Hãy chú ý`,
        kioskName: kiot
      }
       transmit.broadcast(`/notification/incoming`, payload)
       return response.ok({ success: true })
    }

    async handleArrival({ request, response }: HttpContext) {
        const { kiot, quantity } = request.body()
        await DeliveryLog.create({
            kiot: kiot,
            quantity: quantity,
        })

        const payload = {
            title: 'Xe hàng đang đến!',
            message: `Xe hàng đã tới ${kiot} và mang theo ${quantity} kiện hàng.`,
            kioskName: kiot
        }
        transmit.broadcast(`/notification/arrived`, payload)
        return response.ok({ success: true })
    }

    async resetKiot({ response }: HttpContext) {
        const topic =  'car/reset'
        const message = JSON.stringify({ command: "RESET_POS" })
        mqttService.publish(topic, message)
        return response.ok({ message: 'Command sent' })
    }

    async startImport({ response }: HttpContext) {
        const kiotConfig = [
            { key: 'kho-a' },
            { key: 'kho-b' },
            { key: 'kho-c' },
            { key: 'kho-d' },
        ]
        const warehouses = await Promise.all(kiotConfig.map(async (config) => {
            const Model = kiotMap[config.key as keyof typeof kiotMap] // Đảm bảo biến kiotMap đã được import hoặc khai báo
            const CAPACITY = 50

            if (!Model) return { id: config.key, remaining: CAPACITY }

            // Chạy song song 2 query In/Out để giảm thời gian chờ database
            const [inRes, outRes] = await Promise.all([
                Model.query().where('type', 'in').sum('quantity as total'),
                Model.query().where('type', 'out').sum('quantity as total')
            ])
            
            const totalIn = Number(inRes[0].$extras.total) || 0
            const totalOut = Number(outRes[0].$extras.total) || 0

            return {
                id: config.key,
                remaining: CAPACITY - (totalIn - totalOut)
            }
        }))

        const topic = 'car/import/start'
        const payload = JSON.stringify({ 
            command: "START_IMPORT",
            warehouses: warehouses
        })
        mqttService.publish(topic, payload)
        return response.ok({ message: 'Command sent' })
    }

        async endImport({ response }: HttpContext) {
        const topic = 'car/import/end'
        const message = JSON.stringify({ command: "END_IMPORT"})
        mqttService.publish(topic, message)
        return response.ok({ message: 'Command sent' })
    }
}

