/**
 * Rotas da API - Pedidos
 * Endpoints para gerenciamento de pedidos
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Simulação de banco de dados em memória
let orders = [];
let deliveredOrders = [];
let orderIdCounter = 1;

// Schema de validação para pedidos
const orderSchema = Joi.object({
    clientLocation: Joi.object({
        x: Joi.number().min(0).max(20).required().messages({
            'number.min': 'Coordenada X deve estar entre 0 e 20',
            'number.max': 'Coordenada X deve estar entre 0 e 20'
        }),
        y: Joi.number().min(0).max(20).required().messages({
            'number.min': 'Coordenada Y deve estar entre 0 e 20',
            'number.max': 'Coordenada Y deve estar entre 0 e 20'
        })
    }).required(),
    weight: Joi.number().min(0.1).max(20).required().messages({
        'number.min': 'Peso deve ser pelo menos 0.1kg',
        'number.max': 'Peso nao pode exceder 20kg'
    }),
    priority: Joi.string().valid('alta', 'media', 'baixa').required().messages({
        'any.only': 'Prioridade deve ser: alta, media ou baixa'
    }),
    customerInfo: Joi.object({
        name: Joi.string().max(100),
        phone: Joi.string().max(20),
        email: Joi.string().email().max(100)
    }).optional()
});

const orderUpdateSchema = Joi.object({
    status: Joi.string().valid('pending', 'assigned', 'delivered', 'cancelled'),
    priority: Joi.string().valid('alta', 'media', 'baixa'),
    assignedDrone: Joi.string()
});

// Função auxiliar para calcular tempo máximo de espera
const getMaxWaitTime = (priority) => {
    const maxWaitTimes = { 'alta': 15, 'media': 30, 'baixa': 60 };
    return maxWaitTimes[priority] || 60;
};

/**
 * POST /api/v1/pedidos
 * Cria um novo pedido
 */
router.post('/', async (req, res) => {
    try {
        const { error, value } = orderSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message,
                details: error.details
            });
        }

        const newOrder = {
            id: `ORDER-${orderIdCounter++}`,
            uuid: uuidv4(),
            location: value.clientLocation,
            weight: value.weight,
            priority: value.priority,
            status: 'pending',
            customerInfo: value.customerInfo || {},
            assignedDrone: null,
            createdAt: new Date().toISOString(),
            deliveredAt: null,
            estimatedDeliveryTime: null,
            updatedAt: new Date().toISOString()
        };

        orders.push(newOrder);

        res.status(201).json({
            success: true,
            data: newOrder,
            message: 'Pedido criado com sucesso',
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
 * GET /api/v1/pedidos
 * Lista pedidos com filtros opcionais
 */
router.get('/', (req, res) => {
    try {
        const { status, priority, assignedDrone, limit = 50, offset = 0 } = req.query;
        
        let filteredOrders = [...orders];
        
        // Filtros
        if (status) {
            filteredOrders = filteredOrders.filter(order => order.status === status);
        }
        
        if (priority) {
            filteredOrders = filteredOrders.filter(order => order.priority === priority);
        }
        
        if (assignedDrone) {
            filteredOrders = filteredOrders.filter(order => order.assignedDrone === assignedDrone);
        }
        
        // Paginação
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        // Estatísticas
        const stats = {
            total: filteredOrders.length,
            pending: filteredOrders.filter(o => o.status === 'pending').length,
            assigned: filteredOrders.filter(o => o.status === 'assigned').length,
            delivered: deliveredOrders.length,
            byPriority: {
                alta: filteredOrders.filter(o => o.priority === 'alta').length,
                media: filteredOrders.filter(o => o.priority === 'media').length,
                baixa: filteredOrders.filter(o => o.priority === 'baixa').length
            }
        };

        res.json({
            success: true,
            data: paginatedOrders,
            stats,
            pagination: {
                offset: startIndex,
                limit: parseInt(limit),
                total: filteredOrders.length,
                hasNext: endIndex < filteredOrders.length
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
 * GET /api/v1/pedidos/:id
 * Busca um pedido específico
 */
router.get('/:id', (req, res) => {
    try {
        let order = orders.find(o => o.id === req.params.id);
        
        if (!order) {
            order = deliveredOrders.find(o => o.id === req.params.id);
        }
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Pedido nao encontrado',
                message: `Pedido com ID ${req.params.id} nao existe`
            });
        }

        // Calcula informações adicionais
        const waitingTime = order.deliveredAt ? 
            Math.floor((new Date(order.deliveredAt) - new Date(order.createdAt)) / (1000 * 60)) :
            Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));

        const enrichedOrder = {
            ...order,
            waitingTime,
            isOverdue: waitingTime > getMaxWaitTime(order.priority)
        };

        res.json({
            success: true,
            data: enrichedOrder,
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
 * PUT /api/v1/pedidos/:id
 * Atualiza um pedido
 */
router.put('/:id', async (req, res) => {
    try {
        const orderIndex = orders.findIndex(o => o.id === req.params.id);
        
        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Pedido nao encontrado',
                message: `Pedido com ID ${req.params.id} nao existe`
            });
        }

        const { error, value } = orderUpdateSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message
            });
        }

        const updatedOrder = {
            ...orders[orderIndex],
            ...value,
            updatedAt: new Date().toISOString()
        };

        orders[orderIndex] = updatedOrder;

        res.json({
            success: true,
            data: updatedOrder,
            message: 'Pedido atualizado com sucesso',
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
 * DELETE /api/v1/pedidos/:id
 * Remove um pedido
 */
router.delete('/:id', (req, res) => {
    try {
        const orderIndex = orders.findIndex(o => o.id === req.params.id);
        
        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Pedido nao encontrado',
                message: `Pedido com ID ${req.params.id} nao existe`
            });
        }

        const order = orders[orderIndex];
        
        // Nao permite deletar pedidos ja atribuidos
        if (order.status === 'assigned') {
            return res.status(400).json({
                success: false,
                error: 'Operacao nao permitida',
                message: 'Nao e possivel deletar pedido ja atribuido a um drone'
            });
        }

        orders.splice(orderIndex, 1);

        res.json({
            success: true,
            message: `Pedido ${req.params.id} removido com sucesso`,
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
 * POST /api/v1/pedidos/:id/deliver
 * Marca um pedido como entregue
 */
router.post('/:id/deliver', (req, res) => {
    try {
        const orderIndex = orders.findIndex(o => o.id === req.params.id);
        
        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Pedido nao encontrado',
                message: `Pedido com ID ${req.params.id} nao existe`
            });
        }

        const order = orders[orderIndex];
        
        if (order.status !== 'assigned') {
            return res.status(400).json({
                success: false,
                error: 'Operacao nao permitida',
                message: 'Apenas pedidos atribuidos podem ser marcados como entregues'
            });
        }

        // Move para lista de entregues
        order.status = 'delivered';
        order.deliveredAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        
        deliveredOrders.push(order);
        orders.splice(orderIndex, 1);

        res.json({
            success: true,
            data: order,
            message: 'Pedido marcado como entregue',
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
 * GET /api/v1/pedidos/stats/summary
 * Retorna estatísticas resumidas dos pedidos
 */
router.get('/stats/summary', (req, res) => {
    try {
        const allOrders = [...orders, ...deliveredOrders];
        const now = new Date();
        
        const stats = {
            total: allOrders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            assigned: orders.filter(o => o.status === 'assigned').length,
            delivered: deliveredOrders.length,
            overdue: orders.filter(o => {
                const waitingTime = Math.floor((now - new Date(o.createdAt)) / (1000 * 60));
                return waitingTime > getMaxWaitTime(o.priority);
            }).length,
            byPriority: {
                alta: allOrders.filter(o => o.priority === 'alta').length,
                media: allOrders.filter(o => o.priority === 'media').length,
                baixa: allOrders.filter(o => o.priority === 'baixa').length
            },
            averageWeight: allOrders.length > 0 ? 
                (allOrders.reduce((sum, o) => sum + o.weight, 0) / allOrders.length).toFixed(1) : 0,
            averageDeliveryTime: deliveredOrders.length > 0 ?
                Math.round(deliveredOrders.reduce((sum, o) => {
                    return sum + Math.floor((new Date(o.deliveredAt) - new Date(o.createdAt)) / (1000 * 60));
                }, 0) / deliveredOrders.length) : 0
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

// Middleware para resetar pedidos (usado pelo sistema)
const resetOrders = () => {
    orders = [];
    deliveredOrders = [];
    orderIdCounter = 1;
};

// Funções utilitárias
const markAsDelivered = (orderId) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        order.status = 'delivered';
        order.deliveredAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        
        deliveredOrders.push(order);
        orders.splice(orderIndex, 1);
        return true;
    }
    return false;
};

// Exporta o router e funções utilitárias
module.exports = router;
module.exports.resetOrders = resetOrders;
module.exports.getOrders = () => orders;
module.exports.getDeliveredOrders = () => deliveredOrders;
module.exports.setOrders = (newOrders) => { orders = newOrders; };
module.exports.markAsDelivered = markAsDelivered;