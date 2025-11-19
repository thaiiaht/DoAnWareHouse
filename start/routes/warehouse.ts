import router from '@adonisjs/core/services/router'

import WarehouseController from '#controllers/warehouse_controller'

router.get('/logs', [WarehouseController, 'index'])
router.post('/api/iot/arrival', [WarehouseController, 'handleArrival'])