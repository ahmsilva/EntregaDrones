/**
 * Rotas da API - Drones
 * Endpoints para gerenciamento de drones
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Simulação de banco de dados em memória
let drones = [];
let droneIdCounter = 1;

// Schema de validação para drones
const droneSchema = Joi.object({
    capacity: Joi.number().min(1).max(20).required().messages({
        'number.min': 'Capacidade deve ser pelo menos 1kg',
        'number.max': 'Capacidade nao pode exceder 20kg'
    }),
    range: Joi.number().min(1).max(50).required().messages({
        'number.min': 'Alcance deve ser pelo menos 1km',
        'number.max': 'Alcance nao pode exceder 50km'
    }),
    status: Joi.string().valid('idle', 'loading', 'flying', 'delivering', 'returning').default('idle')
});

const droneUpdateSchema = Joi.object({
    capacity: Joi.number().min(1).max(20),
    range: Joi.number().min(1).max(50),
    status: Joi.string().valid('idle', 'loading', 'flying', 'delivering', 'returning'),
    battery: Joi.number().min(0).max(100),
    position: Joi.object({
        x: Joi.number().min(0).max(20),
        y: Joi.number().min(0).max(20)
    })
});

/**
 * GET /api/v1/drones/status
 * Retorna status de todos os drones
 */
router.get('/status', (req, res) => {
    try {
        const dronesStatus = drones.map(drone => ({
            id: drone.id,
            status: drone.status,
            battery: drone.battery,
            currentLoad: drone.currentLoad,
            capacity: drone.capacity,
            position: drone.position,
            assignedOrders: drone.assignedOrders.length,
            deliveriesCount: drone.deliveriesCount,
            totalDistance: drone.totalDistance,
            efficiency: drone.efficiency || 0
        }));

        const summary = {
            totalDrones: drones.length,
            activeDrones: drones.filter(d => d.status !== 'idle').length,
            idleDrones: drones.filter(d => d.status === 'idle').length,
            averageBattery: drones.length > 0 ? 
                Math.round(drones.reduce((sum, d) => sum + d.battery, 0) / drones.length) : 0,
            totalDeliveries: drones.reduce((sum, d) => sum + d.deliveriesCount, 0)
        };

        res.json({
            success: true,
            data: {
                drones: dronesStatus,
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
 * GET /api/v1/drones
 * Lista todos os drones
 */
router.get('/', (req, res) => {
    try {
        const { status, available } = req.query;
        
        let filteredDrones = [...drones];
        
        if (status) {
            filteredDrones = filteredDrones.filter(drone => drone.status === status);
        }
        
        if (available === 'true') {
            filteredDrones = filteredDrones.filter(drone => 
                drone.status === 'idle' && drone.battery >= 20
            );
        }

        res.json({
            success: true,
            data: filteredDrones,
            count: filteredDrones.length,
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
 * GET /api/v1/drones/:id
 * Busca um drone específico
 */
router.get('/:id', (req, res) => {
    try {
        const drone = drones.find(d => d.id === req.params.id);
        
        if (!drone) {
            return res.status(404).json({
                success: false,
                error: 'Drone nao encontrado',
                message: `Drone com ID ${req.params.id} nao existe`
            });
        }

        res.json({
            success: true,
            data: drone,
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
 * POST /api/v1/drones
 * Cria um novo drone
 */
router.post('/', async (req, res) => {
    try {
        const { error, value } = droneSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                message: error.details[0].message,
                details: error.details
            });
        }

        const newDrone = {
            id: `DRONE-${droneIdCounter++}`,
            uuid: uuidv4(),
            capacity: value.capacity,
            range: value.range,
            currentLoad: 0,
            battery: 100,
            position: { x: 10, y: 10 }, // Base position
            status: value.status,
            assignedOrders: [],
            currentRoute: [],
            totalDistance: 0,
            deliveriesCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        drones.push(newDrone);

        res.status(201).json({
            success: true,
            data: newDrone,
            message: 'Drone criado com sucesso',
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
 * PUT /api/v1/drones/:id
 * Atualiza um drone existente
 */
router.put('/:id', async (req, res) => {
    try {
        const droneIndex = drones.findIndex(d => d.id === req.params.id);
        
        if (droneIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Drone nao encontrado',
                message: `Drone com ID ${req.params.id} nao existe`
            });
        }

        const { error, value } = droneUpdateSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                message: error.details[0].message,
                details: error.details
            });
        }

        // Atualiza apenas os campos fornecidos
        const updatedDrone = {
            ...drones[droneIndex],
            ...value,
            updatedAt: new Date().toISOString()
        };

        drones[droneIndex] = updatedDrone;

        res.json({
            success: true,
            data: updatedDrone,
            message: 'Drone atualizado com sucesso',
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
 * DELETE /api/v1/drones/:id
 * Remove um drone
 */
router.delete('/:id', (req, res) => {
    try {
        const droneIndex = drones.findIndex(d => d.id === req.params.id);
        
        if (droneIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Drone nao encontrado',
                message: `Drone com ID ${req.params.id} nao existe`
            });
        }

        const drone = drones[droneIndex];
        
        // Nao permite deletar drones em operacao
        if (drone.status !== 'idle') {
            return res.status(400).json({
                success: false,
                error: 'Operacao nao permitida',
                message: 'Nao e possivel deletar drone que esta em operacao'
            });
        }

        drones.splice(droneIndex, 1);

        res.json({
            success: true,
            message: `Drone ${req.params.id} removido com sucesso`,
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
 * POST /api/v1/drones/batch
 * Cria múltiplos drones de uma vez
 */
router.post('/batch', async (req, res) => {
    try {
        const { count, capacity, range } = req.body;
        
        if (!count || count < 1 || count > 10) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: 'Numero de drones deve estar entre 1 e 10'
            });
        }

        const { error } = droneSchema.validate({ capacity, range });
        
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message
            });
        }

        const newDrones = [];
        for (let i = 0; i < count; i++) {
            const drone = {
                id: `DRONE-${droneIdCounter++}`,
                uuid: uuidv4(),
                capacity,
                range,
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
            
            drones.push(drone);
            newDrones.push(drone);
        }

        res.status(201).json({
            success: true,
            data: newDrones,
            message: `${count} drones criados com sucesso`,
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

// Middleware para resetar drones (usado pelo sistema)
const resetDrones = () => {
    drones = [];
    droneIdCounter = 1;
};

// Exporta o router e funções utilitárias
module.exports = router;
module.exports.resetDrones = resetDrones;
module.exports.getDrones = () => drones;
module.exports.setDrones = (newDrones) => { drones = newDrones; };