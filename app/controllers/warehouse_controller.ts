import { HttpContext } from '@adonisjs/core/http'
import DeliveryLog from '#models/delivery_log'
import transmit from '@adonisjs/transmit/services/main'
import mqttService from '#services/mqtt_service'

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
        const topic = 'car/import/start'
        const message = JSON.stringify({ command: "START_IMPORT"})
        mqttService.publish(topic, message)
        return response.ok({ message: 'Command sent' })
    }

        async endImport({ response }: HttpContext) {
        const topic = 'car/import/end'
        const message = JSON.stringify({ command: "END_IMPORT"})
        mqttService.publish(topic, message)
        return response.ok({ message: 'Command sent' })
    }
}

