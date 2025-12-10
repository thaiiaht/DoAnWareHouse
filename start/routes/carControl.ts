import router from '@adonisjs/core/services/router'
// Import service MỚI
import carService from '#services/car_control_service' 

// (Giữ nguyên các route cũ của bạn nếu có) ...


router.get('/car/control', async ({ view }) => {
  return view.render('control')
})

// API điều khiển xe (Dùng service mới)
router.post('/cmd', async ({ request, response }) => {
  // Lấy data dạng mảng [speed, angle]
  const [v, a] = request.body() as number[]
  
  // Gọi hàm drive bên service mới
  carService.drive(v, a)
  
  return response.noContent()
})

// API trạng thái (Dùng service mới)
router.get('/stat', async ({ response }) => {
  return response.json(carService.currentStatus)
})