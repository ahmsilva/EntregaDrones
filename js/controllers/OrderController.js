/**
 * OrderController - Controlador responsável pelo gerenciamento dos pedidos
 * Controla criação, validação e operações dos pedidos
 */
class OrderController {
    constructor() {
        this.orders = [];
        this.orderIdCounter = 1;
        this.deliveredOrders = [];
    }

    /**
     * Adiciona um novo pedido ao sistema
     * @param {Object} orderData - Dados do pedido {x, y, weight, priority}
     * @returns {Object} - Resultado da operação
     */
    addOrder(orderData) {
        try {
            // Cria novo pedido
            const order = new Order(
                `ORDER-${this.orderIdCounter}`,
                { x: parseFloat(orderData.x), y: parseFloat(orderData.y) },
                parseFloat(orderData.weight),
                orderData.priority
            );

            // Valida o pedido
            const validation = order.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dados inválidos: ' + validation.errors.join(', '),
                    errors: validation.errors
                };
            }

            // Adiciona à lista de pedidos
            this.orders.push(order);
            this.orderIdCounter++;

            console.log(`Pedido ${order.id} adicionado:`, order.getOrderInfo());

            // Atualiza interface
            if (window.uiView) {
                window.uiView.updateOrdersList();
                window.uiView.updateStatistics();
            }
            if (window.mapView) {
                window.mapView.updateMap();
            }

            return {
                success: true,
                message: `Pedido ${order.id} adicionado com sucesso`,
                order: order
            };

        } catch (error) {
            console.error('Erro ao adicionar pedido:', error);
            return {
                success: false,
                message: 'Erro interno ao adicionar pedido',
                error: error.message
            };
        }
    }

    /**
     * Remove um pedido do sistema
     * @param {string} orderId - ID do pedido
     * @returns {boolean} - True se removido com sucesso
     */
    removeOrder(orderId) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            return false;
        }

        const order = this.orders[orderIndex];
        
        // Se o pedido está atribuído, remove do drone
        if (order.assignedDrone && window.droneController) {
            const drone = window.droneController.getDroneById(order.assignedDrone);
            if (drone) {
                drone.assignedOrders = drone.assignedOrders.filter(o => o.id !== orderId);
                drone.currentLoad = Math.max(0, drone.currentLoad - order.weight);
            }
        }

        this.orders.splice(orderIndex, 1);
        console.log(`Pedido ${orderId} removido`);

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateOrdersList();
            window.uiView.updateStatistics();
        }
        if (window.mapView) {
            window.mapView.updateMap();
        }

        return true;
    }

    /**
     * Retorna todos os pedidos
     * @returns {Array} - Array de pedidos
     */
    getAllOrders() {
        return this.orders;
    }

    /**
     * Retorna pedidos pendentes (não atribuídos)
     * @returns {Array} - Array de pedidos pendentes
     */
    getPendingOrders() {
        return this.orders.filter(order => order.status === 'pending');
    }

    /**
     * Retorna pedidos atribuídos
     * @returns {Array} - Array de pedidos atribuídos
     */
    getAssignedOrders() {
        return this.orders.filter(order => order.status === 'assigned');
    }

    /**
     * Retorna pedidos entregues
     * @returns {Array} - Array de pedidos entregues
     */
    getDeliveredOrders() {
        return [...this.deliveredOrders, ...this.orders.filter(order => order.status === 'delivered')];
    }

    /**
     * Encontra um pedido pelo ID
     * @param {string} orderId - ID do pedido
     * @returns {Order|null} - Pedido encontrado ou null
     */
    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId) || 
               this.deliveredOrders.find(order => order.id === orderId) || null;
    }

    /**
     * Marca um pedido como entregue
     * @param {string} orderId - ID do pedido
     * @returns {boolean} - True se marcado com sucesso
     */
    markAsDelivered(orderId) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            return false;
        }

        const order = this.orders[orderIndex];
        order.updateStatus('delivered');

        // Move para lista de entregues
        this.deliveredOrders.push(order);
        this.orders.splice(orderIndex, 1);

        console.log(`Pedido ${orderId} marcado como entregue`);

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateOrdersList();
            window.uiView.updateStatistics();
        }

        return true;
    }

    /**
     * Filtra pedidos por prioridade
     * @param {string} priority - Prioridade ('alta', 'media', 'baixa')
     * @returns {Array} - Array de pedidos filtrados
     */
    getOrdersByPriority(priority) {
        return this.orders.filter(order => order.priority === priority);
    }

    /**
     * Filtra pedidos por status
     * @param {string} status - Status do pedido
     * @returns {Array} - Array de pedidos filtrados
     */
    getOrdersByStatus(status) {
        return this.orders.filter(order => order.status === status);
    }

    /**
     * Encontra pedidos próximos a uma localização
     * @param {Object} location - Localização {x, y}
     * @param {number} radius - Raio de busca
     * @returns {Array} - Array de pedidos próximos
     */
    getNearbyOrders(location, radius = 2) {
        return this.orders.filter(order => {
            const distance = order.getDistanceTo(location);
            return distance <= radius && order.status === 'pending';
        });
    }

    /**
     * Agrupa pedidos próximos para otimizar entregas
     * @param {number} maxDistance - Distância máxima para agrupamento
     * @returns {Array} - Array de grupos de pedidos
     */
    groupNearbyOrders(maxDistance = 2) {
        const pendingOrders = this.getPendingOrders();
        const groups = [];
        const processed = new Set();

        for (const order of pendingOrders) {
            if (processed.has(order.id)) {
                continue;
            }

            const group = [order];
            processed.add(order.id);

            // Encontra pedidos próximos
            for (const otherOrder of pendingOrders) {
                if (processed.has(otherOrder.id)) {
                    continue;
                }

                if (order.canGroupWith(otherOrder, maxDistance)) {
                    group.push(otherOrder);
                    processed.add(otherOrder.id);
                }
            }

            groups.push(group);
        }

        return groups;
    }

    /**
     * Retorna estatísticas dos pedidos
     * @returns {Object} - Estatísticas dos pedidos
     */
    getOrderStatistics() {
        const allOrders = [...this.orders, ...this.deliveredOrders];
        
        const stats = {
            totalOrders: allOrders.length,
            pendingOrders: this.getPendingOrders().length,
            assignedOrders: this.getAssignedOrders().length,
            deliveredOrders: this.getDeliveredOrders().length,
            highPriorityOrders: this.getOrdersByPriority('alta').length,
            mediumPriorityOrders: this.getOrdersByPriority('media').length,
            lowPriorityOrders: this.getOrdersByPriority('baixa').length,
            overdueOrders: 0,
            averageDeliveryTime: 0,
            averageWeight: 0
        };

        // Calcula pedidos atrasados
        stats.overdueOrders = this.orders.filter(order => order.isOverdue()).length;

        // Calcula tempo médio de entrega
        const deliveredOrders = this.getDeliveredOrders();
        if (deliveredOrders.length > 0) {
            const totalDeliveryTime = deliveredOrders
                .map(order => order.getDeliveryTime())
                .filter(time => time !== null)
                .reduce((sum, time) => sum + time, 0);
            
            stats.averageDeliveryTime = Math.round(totalDeliveryTime / deliveredOrders.length);
        }

        // Calcula peso médio
        if (allOrders.length > 0) {
            const totalWeight = allOrders.reduce((sum, order) => sum + order.weight, 0);
            stats.averageWeight = parseFloat((totalWeight / allOrders.length).toFixed(1));
        }

        return stats;
    }

    /**
     * Gera pedidos de exemplo para demonstração
     * @param {number} count - Número de pedidos a gerar
     */
    generateSampleOrders(count = 5) {
        const priorities = ['alta', 'media', 'baixa'];
        const generatedOrders = [];

        for (let i = 0; i < count; i++) {
            const orderData = {
                x: Math.floor(Math.random() * 21), // 0-20
                y: Math.floor(Math.random() * 21), // 0-20
                weight: parseFloat((Math.random() * 4.9 + 0.1).toFixed(1)), // 0.1-5.0 kg
                priority: priorities[Math.floor(Math.random() * priorities.length)]
            };

            const result = this.addOrder(orderData);
            if (result.success) {
                generatedOrders.push(result.order);
            }
        }

        console.log(`${generatedOrders.length} pedidos de exemplo gerados`);
        return generatedOrders;
    }

    /**
     * Limpa todos os pedidos do sistema
     */
    clearAllOrders() {
        this.orders = [];
        this.deliveredOrders = [];
        this.orderIdCounter = 1;

        console.log('Todos os pedidos foram removidos');

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateOrdersList();
            window.uiView.updateStatistics();
        }
        if (window.mapView) {
            window.mapView.updateMap();
        }
    }

    /**
     * Exporta todos os pedidos
     * @returns {Object} - Dados dos pedidos para exportação
     */
    exportOrders() {
        return {
            orders: this.orders.map(order => order.toJSON()),
            deliveredOrders: this.deliveredOrders.map(order => order.toJSON()),
            orderIdCounter: this.orderIdCounter,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Importa pedidos
     * @param {Object} data - Dados dos pedidos para importar
     * @returns {boolean} - True se importado com sucesso
     */
    importOrders(data) {
        try {
            this.orders = (data.orders || []).map(orderData => Order.fromJSON(orderData));
            this.deliveredOrders = (data.deliveredOrders || []).map(orderData => Order.fromJSON(orderData));
            this.orderIdCounter = data.orderIdCounter || 1;

            console.log('Pedidos importados com sucesso');

            // Atualiza interface
            if (window.uiView) {
                window.uiView.updateOrdersList();
                window.uiView.updateStatistics();
            }
            if (window.mapView) {
                window.mapView.updateMap();
            }

            return true;
        } catch (error) {
            console.error('Erro ao importar pedidos:', error);
            return false;
        }
    }

    /**
     * Valida dados de pedido antes de criar
     * @param {Object} orderData - Dados do pedido
     * @returns {Object} - Resultado da validação
     */
    validateOrderData(orderData) {
        const errors = [];

        if (!orderData.x || orderData.x < 0 || orderData.x > 20) {
            errors.push('Coordenada X deve estar entre 0 e 20');
        }

        if (!orderData.y || orderData.y < 0 || orderData.y > 20) {
            errors.push('Coordenada Y deve estar entre 0 e 20');
        }

        if (!orderData.weight || orderData.weight < 0.1 || orderData.weight > 20) {
            errors.push('Peso deve estar entre 0.1kg e 20kg');
        }

        if (!['alta', 'media', 'baixa'].includes(orderData.priority)) {
            errors.push('Prioridade deve ser alta, média ou baixa');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}