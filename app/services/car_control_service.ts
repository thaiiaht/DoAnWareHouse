import mqtt from 'mqtt'
import env from '#start/env'

class CarControlService {
  private client: mqtt.MqttClient | null = null
  
  // Biến lưu trạng thái xe (để API Polling lấy nhanh)
  public currentStatus = { b: 0, s: 'unknown' } 

  constructor() {
    this.connect()
  }

  private connect() {
    const host = env.get('MQTT_HOST', 'mqtt://localhost')

    // Cấu hình tối ưu độ trễ (Low Latency) cho việc lái xe
    this.client = mqtt.connect(host, {
      keepalive: 60,
      clean: true,
      connectTimeout: 5000,
      // Tắt Nagle Algorithm để gói tin đi ngay lập tức
      properties: { userProperties: { noDelay: 'true' } } 
    })

    this.client.on('connect', () => {
      console.log('🏎️ Car Control Service: Connected!')
      // Chỉ subscribe topic trạng thái xe
      this.subscribe('car/st')
      this.subscribe('car/import/start')
      this.subscribe('car/import/end')
      this.subscribe('car/send/qr')
    })

    this.client.on('error', (err) => {
      console.error('❌ Car MQTT Error:', err)
    })

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString())
    })
  }

  // Xử lý cập nhật trạng thái từ xe (Pin, Trạng thái)
  private handleMessage(topic: string, message: string) {
    if (topic === 'car/st') {
      try {
        // Cập nhật biến cục bộ để phục vụ Polling
        this.currentStatus = JSON.parse(message)
      } catch (e) {
        // Bỏ qua lỗi parse JSON để không crash app
      }
    }
  }

  public subscribe(topic: string) {
    if (this.client) {
      this.client.subscribe(topic)
    }
  }

  // Hàm chuyên dụng để lái xe (Gửi mảng [v, a])
  public drive(velocity: number, angle: number) {
    if (this.client && this.client.connected) {
      const topic = 'car/ctl'
      // Gửi mảng rút gọn để tối ưu băng thông
      const payload = JSON.stringify([velocity, angle]) 
      
      // In log như bạn yêu cầu
      console.log(`🚀 Sent [${topic}]: ${payload}`)

      // QoS 0: Fire and forget (Gửi nhanh nhất, không chờ xác nhận)
      this.client.publish(topic, payload, { qos: 0 })
    } else {
      console.log('⚠️ Car MQTT not connected, cannot drive')
    }
  }
}

// Export dưới dạng Singleton giống file cũ của bạn
export default new CarControlService()