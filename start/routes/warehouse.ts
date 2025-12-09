import router from '@adonisjs/core/services/router'

import WarehouseController from '#controllers/warehouse_controller'

router.get('/logs', [WarehouseController, 'index'])
router.post('/api/iot/arrival', [WarehouseController, 'handleArrival'])
router.post('/api/kiot/reset', [WarehouseController, 'resetKiot'])
router.post('/api/iot/incoming', [WarehouseController, 'arrival'])
router.post('/api/iot/start', [WarehouseController, 'startImport'])
router.post('/api/iot/end', [WarehouseController, 'endImport'])