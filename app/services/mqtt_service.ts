// app/services/mqtt_service.ts
import mqtt from 'mqtt'
import env from '#start/env'
import DeliveryLog from '#models/delivery_log'
import transmit from '@adonisjs/transmit/services/main'

class MqttService {
  private client: mqtt.MqttClient | null = null

  constructor() {
    // Khởi tạo kết nối ngay khi Service được gọi
    this.connect()
  }

  private connect() {
    const host = env.get('MQTT_HOST', 'mqtt://localhost')
    // Nếu có username/pass thì thêm option vào
    this.client = mqtt.connect(host)

    this.client.on('connect', () => {
      console.log('✅ MQTT: Connected to Mosquitto Broker')
      this.subscribe('car/incoming')
      this.subscribe('car/arrived')
      this.subscribe('car/reset')
    })

    this.client.on('error', () => {
    })
    
    // Xử lý tin nhắn nhận được từ ESP
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString())
    })
  }

  // Hàm xử lý logic khi nhận tin nhắn
  private async handleMessage(topic: string, message: string) {
    console.log(`📩 Received [${topic}]: ${message}`)
    if (topic === 'car/incoming') {
      await this.incomingNotification(message)
    }
    else if (topic === 'car/arrived') {
      await this.saveAndBroadcast(message)
    }
  }

  private async incomingNotification(jsonString: string) {
    try {
      const data = JSON.parse(jsonString)
      const payload = {
        title: 'Xe hàng đang đến!',
        message: `Xe hàng đang tới ${data.kiot}. Hãy chú ý`,
        kioskName: data.kiot
      }
      await transmit.broadcast(`/notification/incoming`, payload)
    } catch (error) {
      console.error('❌ Error:', error)  
    }
  }

  private async saveAndBroadcast(jsonString: string) {
    try {
      const data = JSON.parse(jsonString)
      const newLog = await DeliveryLog.create({
          kiot: data.kiot,
          quantity: data.quantity,
      })

    console.log('✅ Saved DB:', newLog.id)

    const payload = {
      title: 'Xe hàng đã đến!',
      message: `Xe hàng đã tới ${newLog.kiot} và mang theo ${newLog.quantity} kiện hàng.`,
      kioskName: newLog.kiot
    }
    console.log(payload)
    await transmit.broadcast(`/notification/arrived`, payload)
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  public subscribe(topic: string) {
    if (this.client) {
      this.client.subscribe(topic)
    }
  }

  public publish(topic: string, message: string) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message)
      console.log(`📤 Sent [${topic}]: ${message}`)
    } else {
      console.log('⚠️ MQTT not connected, cannot publish')
    }
  }
}

// Export dưới dạng Singleton
export default new MqttService()