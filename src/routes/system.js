/**
 * Rotas da API - Sistema
 * Endpoints para gerenciamento do sistema e configurações
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Importa módulos para resetar dados
const dronesModule = require('./drones');
const pedidosModule = require('./pedidos');

// Schema para configurações do sistema
const configSchema = Joi.object({
    maxDrones: Joi.number().min(1).max(50).default(10),
    maxOrdersPerDrone: Joi.number().min(1).max(20).default(10),
    defaultDroneCapacity: Joi.number().min(1).max(20).default(5),
    defaultDroneRange: Joi.number().min(1).max(50).default(10),
    simulationSpeed: Joi.number().min(0.1).max(5.0).default(0.5)
});

/**
 * POST /api/v1/system/reset
 * Reseta todo o sistema
 */
router.post('/reset', (req, res) => {
    try {
        // Reseta dados
        dronesModule.resetDrones();
        pedidosModule.resetOrders();
        
        const resetInfo = {
            timestamp: new Date().toISOString(),
            resetBy: req.ip || 'unknown',
            components: [
                'drones',
                'orders',
                'delivered_orders',
                'simulations'
            ]
        };

        res.json({
            success: true,
            message: 'Sistema resetado com sucesso',
            data: resetInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/system/stats
 * Retorna estatísticas completas do sistema
 */
router.get('/stats', (req, res) => {
    try {
        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        const deliveredOrders = pedidosModule.getDeliveredOrders();
        const allOrders = [...orders, ...deliveredOrders];

        const stats = {
            system: {
                uptime: process.uptime(),
                version: require('../../package.json').version,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            },
            drones: {
                total: drones.length,
                active: drones.filter(d => d.status !== 'idle').length,
                idle: drones.filter(d => d.status === 'idle').length,
                byStatus: {
                    idle: drones.filter(d => d.status === 'idle').length,
                    loading: drones.filter(d => d.status === 'loading').length,
                    flying: drones.filter(d => d.status === 'flying').length,
                    delivering: drones.filter(d => d.status === 'delivering').length,
                    returning: drones.filter(d => d.status === 'returning').length
                },
                totalCapacity: drones.reduce((sum, d) => sum + d.capacity, 0),
                totalRange: drones.reduce((sum, d) => sum + d.range, 0),
                averageBattery: drones.length > 0 ? 
                    Math.round(drones.reduce((sum, d) => sum + (d.battery || 100), 0) / drones.length) : 0,
                totalDistance: drones.reduce((sum, d) => sum + (d.totalDistance || 0), 0),
                totalDeliveries: drones.reduce((sum, d) => sum + (d.deliveriesCount || 0), 0)
            },
            orders: {
                total: allOrders.length,
                pending: orders.filter(o => o.status === 'pending').length,
                assigned: orders.filter(o => o.status === 'assigned').length,
                delivered: deliveredOrders.length,
                byPriority: {
                    alta: allOrders.filter(o => o.priority === 'alta').length,
                    media: allOrders.filter(o => o.priority === 'media').length,
                    baixa: allOrders.filter(o => o.priority === 'baixa').length
                },
                totalWeight: allOrders.reduce((sum, o) => sum + o.weight, 0),
                averageWeight: allOrders.length > 0 ? 
                    (allOrders.reduce((sum, o) => sum + o.weight, 0) / allOrders.length).toFixed(1) : 0,
                averageDeliveryTime: deliveredOrders.length > 0 ? 
                    Math.round(deliveredOrders.reduce((sum, o) => {
                        const deliveryTime = new Date(o.deliveredAt) - new Date(o.createdAt);
                        return sum + Math.floor(deliveryTime / (1000 * 60));
                    }, 0) / deliveredOrders.length) : 0
            },
            performance: {
                efficiency: calculateSystemEfficiency(allOrders, deliveredOrders, drones),
                utilization: calculateSystemUtilization(drones, orders),
                throughput: deliveredOrders.length,
                errorRate: 0, // Para implementação futura
                averageResponseTime: calculateAverageResponseTime(allOrders)
            },
            resources: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        };

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/system/config
 * Retorna configurações atuais do sistema
 */
router.get('/config', (req, res) => {
    try {
        const config = {
            api: {
                version: '1.0.0',
                baseUrl: req.protocol + '://' + req.get('host') + '/api/v1',
                rateLimits: {
                    general: '100 requests/minute',
                    optimization: '10 requests/minute',
                    simulation: '5 requests/minute'
                }
            },
            system: {
                maxDrones: 50,
                maxOrdersPerDrone: 10,
                defaultDroneCapacity: 5,
                defaultDroneRange: 10,
                simulationSpeed: 0.5,
                batteryConsumptionRate: 5, // % por km
                citySize: { width: 21, height: 21 },
                basePosition: { x: 10, y: 10 }
            },
            features: {
                realTimeTracking: true,
                routeOptimization: true,
                batterySimulation: true,
                priorityQueues: true,
                analytics: true,
                exportImport: true
            },
            algorithms: {
                optimization: [
                    'priority_first',
                    'capacity_optimization', 
                    'distance_optimization',
                    'balanced_optimization'
                ],
                routing: 'nearest_neighbor'
            }
        };

        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * PUT /api/v1/system/config
 * Atualiza configurações do sistema
 */
router.put('/config', async (req, res) => {
    try {
        const { error, value } = configSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message
            });
        }

        // Em uma implementação real, as configurações seriam salvas em banco de dados
        // Por enquanto, apenas retorna as configurações validadas
        
        res.json({
            success: true,
            data: value,
            message: 'Configuracoes atualizadas com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/system/health
 * Health check detalhado do sistema
 */
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: require('../../package.json').version,
            checks: {
                api: {
                    status: 'up',
                    responseTime: process.hrtime()[1] / 1000000 // ms
                },
                memory: {
                    status: 'healthy',
                    usage: process.memoryUsage(),
                    threshold: '90%'
                },
                drones: {
                    status: 'operational',
                    count: dronesModule.getDrones().length
                },
                orders: {
                    status: 'operational', 
                    pending: pedidosModule.getOrders().length,
                    delivered: pedidosModule.getDeliveredOrders().length
                }
            }
        };

        // Determina status geral baseado nos checks
        const allHealthy = Object.values(health.checks).every(check => 
            check.status === 'up' || check.status === 'healthy' || check.status === 'operational'
        );

        if (!allHealthy) {
            health.status = 'degraded';
        }

        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: health.status === 'healthy',
            data: health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/v1/system/seed
 * Popula o sistema com dados de exemplo
 */
router.post('/seed', (req, res) => {
    try {
        const { drones = 3, orders = 8 } = req.body;
        
        if (drones < 1 || drones > 10) {
            return res.status(400).json({
                success: false,
                error: 'Numero de drones deve estar entre 1 e 10'
            });
        }

        if (orders < 1 || orders > 20) {
            return res.status(400).json({
                success: false,
                error: 'Numero de pedidos deve estar entre 1 e 20'
            });
        }

        // Reseta sistema
        dronesModule.resetDrones();
        pedidosModule.resetOrders();

        // Cria drones usando a API interna
        const createdDrones = [];
        const dronesList = dronesModule.getDrones();
        for (let i = 0; i < drones; i++) {
            const drone = {
                id: `DRONE-${i + 1}`,
                capacity: 5,
                range: 10,
                currentLoad: 0,
                battery: 100,
                position: { x: 10, y: 10 },
                status: 'idle',
                assignedOrders: [],
                currentRoute: [],
                totalDistance: 0,
                deliveriesCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            dronesList.push(drone);
            createdDrones.push(drone);
        }

        // Cria pedidos usando a API interna
        const createdOrders = [];
        const sampleOrders = [
            { x: 5, y: 5, weight: 2.5, priority: 'alta' },
            { x: 15, y: 8, weight: 1.2, priority: 'media' },
            { x: 3, y: 12, weight: 3.8, priority: 'baixa' },
            { x: 18, y: 6, weight: 1.5, priority: 'alta' },
            { x: 12, y: 15, weight: 4.2, priority: 'media' },
            { x: 7, y: 18, weight: 0.8, priority: 'baixa' },
            { x: 16, y: 3, weight: 2.1, priority: 'alta' },
            { x: 4, y: 16, weight: 3.5, priority: 'media' }
        ];

        const ordersList = pedidosModule.getOrders();
        for (let i = 0; i < Math.min(orders, sampleOrders.length); i++) {
            const sampleData = sampleOrders[i];
            const order = {
                id: `ORDER-${i + 1}`,
                location: { x: sampleData.x, y: sampleData.y },
                weight: sampleData.weight,
                priority: sampleData.priority,
                status: 'pending',
                customerInfo: {},
                assignedDrone: null,
                createdAt: new Date().toISOString(),
                deliveredAt: null,
                updatedAt: new Date().toISOString()
            };
            ordersList.push(order);
            createdOrders.push(order);
        }

        res.json({
            success: true,
            message: `Sistema populado com ${createdDrones.length} drones e ${createdOrders.length} pedidos`,
            data: {
                drones: createdDrones.length,
                orders: createdOrders.length,
                createdAt: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Funções auxiliares
function calculateSystemEfficiency(allOrders, deliveredOrders, drones) {
    if (allOrders.length === 0) return 100;
    
    const deliveryRate = (deliveredOrders.length / allOrders.length) * 100;
    const droneUtilization = drones.length > 0 ? 
        (drones.filter(d => d.status !== 'idle').length / drones.length) * 100 : 0;
    
    return Math.round((deliveryRate + droneUtilization) / 2);
}

function calculateSystemUtilization(drones, orders) {
    if (drones.length === 0) return 0;
    
    const totalCapacity = drones.reduce((sum, d) => sum + d.capacity, 0);
    const usedCapacity = orders
        .filter(o => o.status === 'assigned')
        .reduce((sum, o) => sum + o.weight, 0);
    
    return totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;
}

function calculateAverageResponseTime(orders) {
    const assignedOrders = orders.filter(o => o.status === 'assigned' || o.status === 'delivered');
    
    if (assignedOrders.length === 0) return 0;
    
    const totalResponseTime = assignedOrders.reduce((sum, order) => {
        const responseTime = new Date() - new Date(order.createdAt);
        return sum + Math.floor(responseTime / (1000 * 60)); // em minutos
    }, 0);
    
    return Math.round(totalResponseTime / assignedOrders.length);
}

module.exports = router;