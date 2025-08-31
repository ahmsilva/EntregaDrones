/**
 * Classe Drone - Modelo para representar um drone no sistema
 * Gerencia estado, capacidade, localização e autonomia
 */
class Drone {
    constructor(id, capacity = 5, range = 10) {
        this.id = id;
        this.capacity = capacity; // Capacidade em kg
        this.range = range; // Alcance em km
        this.currentLoad = 0; // Carga atual em kg
        this.battery = 100; // Bateria em percentual
        this.position = { x: 10, y: 10 }; // Posição inicial (base)
        this.status = 'idle'; // Estados: idle, loading, flying, delivering, returning
        this.assignedOrders = []; // Pedidos atribuídos para esta viagem
        this.currentRoute = []; // Rota atual
        this.totalDistance = 0; // Distância total percorrida
        this.deliveriesCount = 0; // Número de entregas realizadas
        this.basePosition = { x: 10, y: 10 }; // Posição da base
        this.currentRouteIndex = 0; // Índice atual na rota
        this.speed = 0.5; // Velocidade do drone (posições por segundo)
    }

    /**
     * Verifica se o drone pode carregar um pedido adicional
     * @param {Order} order - Pedido a ser verificado
     * @returns {boolean} - True se pode carregar
     */
    canCarryOrder(order) {
        const newLoad = this.currentLoad + order.weight;
        const distanceToOrder = this.calculateDistance(this.position, order.location);
        const distanceToBase = this.calculateDistance(order.location, this.basePosition);
        const totalDistance = distanceToOrder + distanceToBase;
        
        return newLoad <= this.capacity && 
               totalDistance <= this.range && 
               this.battery >= this.calculateBatteryNeeded(totalDistance);
    }

    /**
     * Atribui um pedido ao drone
     * @param {Order} order - Pedido a ser atribuído
     * @returns {boolean} - True se foi possível atribuir
     */
    assignOrder(order) {
        if (this.canCarryOrder(order)) {
            this.assignedOrders.push(order);
            this.currentLoad += order.weight;
            order.status = 'assigned';
            order.assignedDrone = this.id;
            return true;
        }
        return false;
    }

    /**
     * Calcula a distância euclidiana entre dois pontos
     * @param {Object} point1 - Ponto inicial {x, y}
     * @param {Object} point2 - Ponto final {x, y}
     * @returns {number} - Distância em km
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calcula a bateria necessária para uma distância
     * @param {number} distance - Distância em km
     * @returns {number} - Percentual de bateria necessário
     */
    calculateBatteryNeeded(distance) {
        // Aproximadamente 5% de bateria por km
        return Math.min(100, distance * 5);
    }

    /**
     * Otimiza a rota dos pedidos atribuídos usando algoritmo nearest neighbor
     * @returns {Array} - Rota otimizada
     */
    optimizeRoute() {
        if (this.assignedOrders.length === 0) {
            return [];
        }

        // Ordena pedidos por prioridade primeiro
        const sortedOrders = this.assignedOrders.sort((a, b) => {
            const priorityOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Algoritmo do vizinho mais próximo para otimizar rota
        const unvisited = [...sortedOrders];
        const route = [{ ...this.basePosition, type: 'base' }]; // Começa na base
        let currentPosition = this.basePosition;

        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistance(currentPosition, unvisited[0].location);

            // Encontra o pedido mais próximo, mas considera prioridade
            for (let i = 1; i < unvisited.length; i++) {
                const distance = this.calculateDistance(currentPosition, unvisited[i].location);
                const priorityWeight = unvisited[i].priority === 'alta' ? 0.7 : 
                                     unvisited[i].priority === 'media' ? 0.85 : 1.0;
                
                if (distance * priorityWeight < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            // Adiciona à rota e remove da lista
            const nearestOrder = unvisited.splice(nearestIndex, 1)[0];
            route.push({ ...nearestOrder.location, type: 'delivery', order: nearestOrder });
            currentPosition = nearestOrder.location;
        }

        // Retorna à base
        route.push({ ...this.basePosition, type: 'base' });
        this.currentRoute = route;
        return route;
    }

    /**
     * Calcula a distância total da rota otimizada
     * @returns {number} - Distância total em km
     */
    calculateRouteDistance() {
        if (this.currentRoute.length < 2) {
            return 0;
        }

        let totalDistance = 0;
        for (let i = 0; i < this.currentRoute.length - 1; i++) {
            totalDistance += this.calculateDistance(this.currentRoute[i], this.currentRoute[i + 1]);
        }
        return totalDistance;
    }

    /**
     * Inicia o processo de entrega
     */
    startDelivery() {
        if (this.assignedOrders.length === 0) {
            return false;
        }

        this.status = 'loading';
        this.optimizeRoute();
        const routeDistance = this.calculateRouteDistance();
        this.totalDistance += routeDistance;
        
        // Simula tempo de carregamento
        setTimeout(() => {
            this.status = 'flying';
            this.currentRouteIndex = 0;
            this.simulateMovement();
        }, 1000);

        return true;
    }

    /**
     * Simula o movimento do drone ao longo da rota
     */
    simulateMovement() {
        if (this.currentRouteIndex >= this.currentRoute.length - 1) {
            this.completeDelivery();
            return;
        }

        const currentPoint = this.currentRoute[this.currentRouteIndex];
        const nextPoint = this.currentRoute[this.currentRouteIndex + 1];
        
        this.moveToPoint(nextPoint, () => {
            if (nextPoint.type === 'delivery') {
                this.deliverOrder(nextPoint.order);
            }
            this.currentRouteIndex++;
            
            // Consome bateria baseada na distância
            const distance = this.calculateDistance(currentPoint, nextPoint);
            this.battery = Math.max(0, this.battery - this.calculateBatteryNeeded(distance));
            
            // Continue para o próximo ponto
            setTimeout(() => this.simulateMovement(), 500);
        });
    }

    /**
     * Move o drone para um ponto específico
     * @param {Object} targetPoint - Ponto de destino
     * @param {Function} callback - Função chamada ao chegar
     */
    moveToPoint(targetPoint, callback) {
        const startPosition = { ...this.position };
        const distance = this.calculateDistance(startPosition, targetPoint);
        const moveTime = distance / this.speed * 1000; // Tempo em ms
        const steps = 20;
        const stepTime = moveTime / steps;

        let currentStep = 0;
        const moveInterval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            this.position.x = startPosition.x + (targetPoint.x - startPosition.x) * progress;
            this.position.y = startPosition.y + (targetPoint.y - startPosition.y) * progress;
            
            // Atualiza a visualização
            if (window.mapView) {
                window.mapView.updateDronePosition(this);
            }
            
            if (currentStep >= steps) {
                clearInterval(moveInterval);
                this.position = { x: targetPoint.x, y: targetPoint.y };
                callback();
            }
        }, stepTime);
    }

    /**
     * Entrega um pedido específico
     * @param {Order} order - Pedido a ser entregue
     */
    deliverOrder(order) {
        this.status = 'delivering';
        order.status = 'delivered';
        order.deliveredAt = new Date();
        this.deliveriesCount++;
        this.currentLoad -= order.weight;
        
        // Remove o pedido da lista de atribuídos
        this.assignedOrders = this.assignedOrders.filter(o => o.id !== order.id);
        
        // Simula tempo de entrega
        setTimeout(() => {
            this.status = 'flying';
        }, 500);
    }

    /**
     * Completa o ciclo de entrega e retorna à base
     */
    completeDelivery() {
        this.status = 'returning';
        this.position = { ...this.basePosition };
        this.currentLoad = 0;
        this.assignedOrders = [];
        this.currentRoute = [];
        this.currentRouteIndex = 0;
        
        setTimeout(() => {
            this.status = 'idle';
            this.battery = 100; // Recarrega na base
        }, 1000);
    }

    /**
     * Reseta o drone para estado inicial
     */
    reset() {
        this.currentLoad = 0;
        this.battery = 100;
        this.position = { ...this.basePosition };
        this.status = 'idle';
        this.assignedOrders = [];
        this.currentRoute = [];
        this.currentRouteIndex = 0;
    }

    /**
     * Verifica se o drone precisa retornar à base (bateria baixa)
     * @returns {boolean} - True se precisa retornar
     */
    needsToReturn() {
        return this.battery < 20;
    }

    /**
     * Calcula a eficiência do drone
     * @returns {number} - Percentual de eficiência
     */
    getEfficiency() {
        if (this.totalDistance === 0) return 0;
        return Math.round((this.deliveriesCount / this.totalDistance) * 100);
    }

    /**
     * Retorna informações de status do drone
     * @returns {Object} - Objeto com informações do drone
     */
    getStatusInfo() {
        return {
            id: this.id,
            status: this.status,
            battery: Math.round(this.battery),
            currentLoad: this.currentLoad.toFixed(1),
            capacity: this.capacity,
            position: this.position,
            assignedOrdersCount: this.assignedOrders.length,
            deliveriesCount: this.deliveriesCount,
            totalDistance: this.totalDistance.toFixed(1),
            efficiency: this.getEfficiency()
        };
    }
}