/**
 * Rotas da API - Entregas
 * Endpoints para gerenciamento de entregas e otimização de rotas
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Importa dados dos outros módulos
const dronesModule = require('./drones');
const pedidosModule = require('./pedidos');

// Schema para otimização
const optimizationSchema = Joi.object({
    strategy: Joi.string().valid('priority_first', 'capacity_optimization', 'distance_optimization', 'balanced_optimization').default('balanced_optimization'),
    maxDistance: Joi.number().min(1).max(50).default(15)
});

// Schema para simulação
const simulationSchema = Joi.object({
    speed: Joi.number().min(0.1).max(2.0).default(0.5),
    realTime: Joi.boolean().default(false)
});

/**
 * GET /api/v1/entregas/rota
 * Retorna rotas otimizadas para todos os drones
 */
router.get('/rota', (req, res) => {
    try {
        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        
        const routes = drones.map(drone => {
            const droneOrders = orders.filter(order => order.assignedDrone === drone.id);
            
            if (droneOrders.length === 0) {
                return {
                    droneId: drone.id,
                    status: drone.status,
                    route: [],
                    totalDistance: 0,
                    estimatedTime: 0,
                    orders: []
                };
            }

            // Calcula rota otimizada
            const optimizedRoute = calculateOptimizedRoute(drone, droneOrders);
            
            return {
                droneId: drone.id,
                status: drone.status,
                route: optimizedRoute.path,
                totalDistance: optimizedRoute.distance,
                estimatedTime: optimizedRoute.estimatedTime,
                orders: droneOrders.map(o => ({
                    id: o.id,
                    location: o.location,
                    weight: o.weight,
                    priority: o.priority
                })),
                efficiency: calculateRouteEfficiency(optimizedRoute, droneOrders)
            };
        });

        const summary = {
            totalRoutes: routes.filter(r => r.route.length > 0).length,
            totalDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0),
            totalEstimatedTime: Math.max(...routes.map(r => r.estimatedTime), 0),
            averageEfficiency: routes.length > 0 ? 
                routes.reduce((sum, r) => sum + (r.efficiency || 0), 0) / routes.length : 0
        };

        res.json({
            success: true,
            data: {
                routes,
                summary
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

/**
 * GET /api/v1/entregas/rota/:droneId
 * Retorna rota específica de um drone
 */
router.get('/rota/:droneId', (req, res) => {
    try {
        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        
        const drone = drones.find(d => d.id === req.params.droneId);
        
        if (!drone) {
            return res.status(404).json({
                success: false,
                error: 'Drone nao encontrado',
                message: `Drone com ID ${req.params.droneId} nao existe`
            });
        }

        const droneOrders = orders.filter(order => order.assignedDrone === drone.id);
        
        if (droneOrders.length === 0) {
            return res.json({
                success: true,
                data: {
                    droneId: drone.id,
                    status: drone.status,
                    route: [],
                    totalDistance: 0,
                    estimatedTime: 0,
                    orders: [],
                    message: 'Drone sem pedidos atribuídos'
                },
                timestamp: new Date().toISOString()
            });
        }

        const optimizedRoute = calculateOptimizedRoute(drone, droneOrders);
        
        res.json({
            success: true,
            data: {
                droneId: drone.id,
                status: drone.status,
                route: optimizedRoute.path,
                totalDistance: optimizedRoute.distance,
                estimatedTime: optimizedRoute.estimatedTime,
                orders: droneOrders,
                efficiency: calculateRouteEfficiency(optimizedRoute, droneOrders),
                batteryConsumption: optimizedRoute.distance * 5 // 5% por km
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

/**
 * POST /api/v1/entregas/otimizar
 * Otimiza a atribuição de pedidos aos drones
 */
router.post('/otimizar', async (req, res) => {
    try {
        const { error, value } = optimizationSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message
            });
        }

        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        
        const availableDrones = drones.filter(d => d.status === 'idle');
        const pendingOrders = orders.filter(o => o.status === 'pending');
        
        if (availableDrones.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum drone disponivel',
                message: 'Todos os drones estao ocupados ou indisponiveis'
            });
        }

        if (pendingOrders.length === 0) {
            return res.json({
                success: true,
                data: {
                    assignedOrders: 0,
                    totalOrders: 0,
                    assignments: []
                },
                message: 'Nenhum pedido pendente para otimizar',
                timestamp: new Date().toISOString()
            });
        }

        // Aplica algoritmo de otimização
        const optimizationResult = applyOptimizationStrategy(
            pendingOrders,
            availableDrones,
            value.strategy,
            value.maxDistance
        );

        res.json({
            success: true,
            data: optimizationResult,
            message: `Otimizacao concluida usando estrategia: ${value.strategy}`,
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
 * POST /api/v1/entregas/simular
 * Inicia simulação de entregas
 */
router.post('/simular', async (req, res) => {
    try {
        const { error, value } = simulationSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message
            });
        }

        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        
        const dronesWithOrders = drones.filter(d => 
            orders.some(o => o.assignedDrone === d.id && o.status === 'assigned')
        );
        
        if (dronesWithOrders.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum drone com pedidos atribuidos',
                message: 'Execute a otimizacao primeiro'
            });
        }

        // Simula início das entregas
        const simulation = {
            id: `SIM-${Date.now()}`,
            startedAt: new Date().toISOString(),
            drones: dronesWithOrders.length,
            totalOrders: orders.filter(o => o.status === 'assigned').length,
            estimatedDuration: calculateSimulationDuration(dronesWithOrders, orders),
            speed: value.speed,
            realTime: value.realTime,
            status: 'running'
        };

        res.json({
            success: true,
            data: simulation,
            message: 'Simulacao iniciada com sucesso',
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
 * GET /api/v1/entregas/status
 * Retorna status atual das entregas
 */
router.get('/status', (req, res) => {
    try {
        const drones = dronesModule.getDrones();
        const orders = pedidosModule.getOrders();
        const deliveredOrders = pedidosModule.getDeliveredOrders();
        
        const status = {
            drones: {
                total: drones.length,
                idle: drones.filter(d => d.status === 'idle').length,
                active: drones.filter(d => d.status !== 'idle').length,
                byStatus: {
                    idle: drones.filter(d => d.status === 'idle').length,
                    loading: drones.filter(d => d.status === 'loading').length,
                    flying: drones.filter(d => d.status === 'flying').length,
                    delivering: drones.filter(d => d.status === 'delivering').length,
                    returning: drones.filter(d => d.status === 'returning').length
                }
            },
            orders: {
                total: orders.length + deliveredOrders.length,
                pending: orders.filter(o => o.status === 'pending').length,
                assigned: orders.filter(o => o.status === 'assigned').length,
                delivered: deliveredOrders.length,
                byPriority: {
                    alta: orders.filter(o => o.priority === 'alta').length,
                    media: orders.filter(o => o.priority === 'media').length,
                    baixa: orders.filter(o => o.priority === 'baixa').length
                }
            },
            performance: {
                totalDistance: drones.reduce((sum, d) => sum + (d.totalDistance || 0), 0),
                totalDeliveries: drones.reduce((sum, d) => sum + (d.deliveriesCount || 0), 0),
                averageBattery: drones.length > 0 ? 
                    Math.round(drones.reduce((sum, d) => sum + (d.battery || 0), 0) / drones.length) : 0,
                efficiency: calculateSystemEfficiency(orders, deliveredOrders, drones)
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: status,
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
function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateOptimizedRoute(drone, orders) {
    const basePosition = { x: 10, y: 10 };
    
    if (orders.length === 0) {
        return {
            path: [basePosition],
            distance: 0,
            estimatedTime: 0
        };
    }

    // Algoritmo nearest neighbor simples
    const route = [basePosition];
    const unvisited = [...orders];
    let currentPosition = basePosition;
    let totalDistance = 0;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = calculateDistance(currentPosition, unvisited[0].location);

        for (let i = 1; i < unvisited.length; i++) {
            const distance = calculateDistance(currentPosition, unvisited[i].location);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        const nearestOrder = unvisited.splice(nearestIndex, 1)[0];
        route.push(nearestOrder.location);
        totalDistance += nearestDistance;
        currentPosition = nearestOrder.location;
    }

    // Retorna à base
    const returnDistance = calculateDistance(currentPosition, basePosition);
    route.push(basePosition);
    totalDistance += returnDistance;

    return {
        path: route,
        distance: totalDistance,
        estimatedTime: Math.round(totalDistance / 0.5 * 60) // minutos
    };
}

function calculateRouteEfficiency(route, orders) {
    if (orders.length === 0 || route.distance === 0) return 0;
    return Math.round((orders.length / route.distance) * 100);
}

function applyOptimizationStrategy(orders, drones, strategy, maxDistance) {
    let assignedOrdersCount = 0;
    const assignments = [];

    // Ordena pedidos por prioridade
    const sortedOrders = orders.sort((a, b) => {
        const priorityScores = { 'alta': 3, 'media': 2, 'baixa': 1 };
        return priorityScores[b.priority] - priorityScores[a.priority];
    });

    for (const order of sortedOrders) {
        // Encontra melhor drone para o pedido
        let bestDrone = null;
        let bestScore = -1;

        for (const drone of drones) {
            if (drone.status !== 'idle') continue;
            
            const distance = calculateDistance({ x: 10, y: 10 }, order.location);
            if (distance > maxDistance) continue;
            
            const currentLoad = (drone.assignedOrders || []).reduce((sum, o) => sum + o.weight, 0);
            if (currentLoad + order.weight > drone.capacity) continue;

            const score = (drone.capacity - currentLoad) / (distance + 1);
            if (score > bestScore) {
                bestScore = score;
                bestDrone = drone;
            }
        }

        if (bestDrone) {
            order.status = 'assigned';
            order.assignedDrone = bestDrone.id;
            bestDrone.assignedOrders = bestDrone.assignedOrders || [];
            bestDrone.assignedOrders.push(order);
            assignedOrdersCount++;
            
            assignments.push({
                orderId: order.id,
                droneId: bestDrone.id,
                distance: calculateDistance({ x: 10, y: 10 }, order.location)
            });
        }
    }

    return {
        assignedOrders: assignedOrdersCount,
        totalOrders: orders.length,
        assignments,
        strategy,
        efficiency: Math.round((assignedOrdersCount / orders.length) * 100)
    };
}

function calculateSimulationDuration(drones, orders) {
    let maxDuration = 0;
    
    for (const drone of drones) {
        const droneOrders = orders.filter(o => o.assignedDrone === drone.id);
        if (droneOrders.length > 0) {
            const route = calculateOptimizedRoute(drone, droneOrders);
            maxDuration = Math.max(maxDuration, route.estimatedTime);
        }
    }
    
    return maxDuration;
}

function calculateSystemEfficiency(orders, deliveredOrders, drones) {
    const totalOrders = orders.length + deliveredOrders.length;
    if (totalOrders === 0) return 0;
    
    const completionRate = (deliveredOrders.length / totalOrders) * 100;
    const averageBattery = drones.length > 0 ? 
        drones.reduce((sum, d) => sum + (d.battery || 0), 0) / drones.length : 0;
    
    return Math.round((completionRate + averageBattery) / 2);
}

module.exports = router;