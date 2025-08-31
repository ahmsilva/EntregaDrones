/**
 * Classe Order - Modelo para representar um pedido no sistema
 * Gerencia informações do pedido, localização, prioridade e status
 */
class Order {
    constructor(id, clientLocation, weight, priority) {
        this.id = id;
        this.location = clientLocation; // {x, y}
        this.weight = weight; // em kg
        this.priority = priority; // 'alta', 'media', 'baixa'
        this.status = 'pending'; // Estados: pending, assigned, delivered, cancelled
        this.createdAt = new Date();
        this.assignedDrone = null;
        this.deliveredAt = null;
        this.estimatedDeliveryTime = null;
    }

    /**
     * Calcula o score de prioridade do pedido
     * @returns {number} - Score numérico da prioridade
     */
    getPriorityScore() {
        const priorityScores = {
            'alta': 3,
            'media': 2,
            'baixa': 1
        };
        return priorityScores[this.priority] || 1;
    }

    /**
     * Calcula o tempo decorrido desde a criação do pedido
     * @returns {number} - Tempo em minutos
     */
    getWaitingTime() {
        const now = new Date();
        const diffMs = now - this.createdAt;
        return Math.floor(diffMs / (1000 * 60)); // em minutos
    }

    /**
     * Verifica se o pedido está atrasado baseado na prioridade
     * @returns {boolean} - True se está atrasado
     */
    isOverdue() {
        const maxWaitTimes = {
            'alta': 15,  // 15 minutos
            'media': 30, // 30 minutos
            'baixa': 60  // 60 minutos
        };
        
        return this.getWaitingTime() > (maxWaitTimes[this.priority] || 60);
    }

    /**
     * Calcula a distância do pedido até um ponto
     * @param {Object} point - Ponto de referência {x, y}
     * @returns {number} - Distância euclidiana
     */
    getDistanceTo(point) {
        const dx = this.location.x - point.x;
        const dy = this.location.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Atualiza o status do pedido
     * @param {string} newStatus - Novo status
     * @param {string} droneId - ID do drone (opcional)
     */
    updateStatus(newStatus, droneId = null) {
        this.status = newStatus;
        
        if (newStatus === 'assigned' && droneId) {
            this.assignedDrone = droneId;
        }
        
        if (newStatus === 'delivered') {
            this.deliveredAt = new Date();
        }
    }

    /**
     * Calcula o tempo total de entrega
     * @returns {number} - Tempo em minutos, ou null se não entregue
     */
    getDeliveryTime() {
        if (!this.deliveredAt) {
            return null;
        }
        
        const diffMs = this.deliveredAt - this.createdAt;
        return Math.floor(diffMs / (1000 * 60)); // em minutos
    }

    /**
     * Verifica se o pedido pode ser agrupado com outros
     * @param {Order} otherOrder - Outro pedido para comparar
     * @param {number} maxDistance - Distância máxima para agrupamento
     * @returns {boolean} - True se podem ser agrupados
     */
    canGroupWith(otherOrder, maxDistance = 2) {
        if (this.status !== 'pending' || otherOrder.status !== 'pending') {
            return false;
        }
        
        const distance = this.getDistanceTo(otherOrder.location);
        return distance <= maxDistance;
    }

    /**
     * Retorna informações formatadas do pedido
     * @returns {Object} - Objeto com informações do pedido
     */
    getOrderInfo() {
        return {
            id: this.id,
            location: this.location,
            weight: this.weight,
            priority: this.priority,
            status: this.status,
            createdAt: this.createdAt.toLocaleTimeString(),
            waitingTime: this.getWaitingTime(),
            isOverdue: this.isOverdue(),
            assignedDrone: this.assignedDrone,
            deliveredAt: this.deliveredAt ? this.deliveredAt.toLocaleTimeString() : null,
            deliveryTime: this.getDeliveryTime()
        };
    }

    /**
     * Cria uma cópia do pedido
     * @returns {Order} - Nova instância do pedido
     */
    clone() {
        const clonedOrder = new Order(
            this.id,
            { ...this.location },
            this.weight,
            this.priority
        );
        
        clonedOrder.status = this.status;
        clonedOrder.createdAt = new Date(this.createdAt);
        clonedOrder.assignedDrone = this.assignedDrone;
        clonedOrder.deliveredAt = this.deliveredAt ? new Date(this.deliveredAt) : null;
        clonedOrder.estimatedDeliveryTime = this.estimatedDeliveryTime;
        
        return clonedOrder;
    }

    /**
     * Valida se os dados do pedido estão corretos
     * @returns {Object} - {isValid: boolean, errors: Array}
     */
    validate() {
        const errors = [];
        
        if (!this.location || typeof this.location.x !== 'number' || typeof this.location.y !== 'number') {
            errors.push('Localização inválida');
        }
        
        if (!this.weight || this.weight <= 0 || this.weight > 20) {
            errors.push('Peso deve estar entre 0.1kg e 20kg');
        }
        
        if (!['alta', 'media', 'baixa'].includes(this.priority)) {
            errors.push('Prioridade deve ser alta, média ou baixa');
        }
        
        if (this.location) {
            if (this.location.x < 0 || this.location.x > 20 || this.location.y < 0 || this.location.y > 20) {
                errors.push('Localização deve estar dentro dos limites da cidade (0-20)');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Estima o tempo de entrega baseado na distância da base
     * @param {Object} baseLocation - Localização da base {x, y}
     * @param {number} averageSpeed - Velocidade média do drone
     * @returns {number} - Tempo estimado em minutos
     */
    estimateDeliveryTime(baseLocation, averageSpeed = 0.5) {
        const distance = this.getDistanceTo(baseLocation);
        const baseTime = (distance / averageSpeed) / 60; // Converte para minutos
        
        // Adiciona tempo baseado na prioridade (pedidos de alta prioridade são mais rápidos)
        const priorityMultiplier = {
            'alta': 1.0,
            'media': 1.2,
            'baixa': 1.5
        };
        
        this.estimatedDeliveryTime = Math.round(baseTime * (priorityMultiplier[this.priority] || 1.2));
        return this.estimatedDeliveryTime;
    }

    /**
     * Converte o pedido para JSON
     * @returns {Object} - Representação JSON do pedido
     */
    toJSON() {
        return {
            id: this.id,
            location: this.location,
            weight: this.weight,
            priority: this.priority,
            status: this.status,
            createdAt: this.createdAt.toISOString(),
            assignedDrone: this.assignedDrone,
            deliveredAt: this.deliveredAt ? this.deliveredAt.toISOString() : null,
            estimatedDeliveryTime: this.estimatedDeliveryTime
        };
    }

    /**
     * Cria um pedido a partir de dados JSON
     * @param {Object} data - Dados JSON do pedido
     * @returns {Order} - Instância do pedido
     */
    static fromJSON(data) {
        const order = new Order(data.id, data.location, data.weight, data.priority);
        order.status = data.status;
        order.createdAt = new Date(data.createdAt);
        order.assignedDrone = data.assignedDrone;
        order.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : null;
        order.estimatedDeliveryTime = data.estimatedDeliveryTime;
        return order;
    }
}