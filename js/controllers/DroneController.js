/**
 * DroneController - Controlador responsável pelo gerenciamento dos drones
 * Controla criação, configuração e operações dos drones
 */
class DroneController {
    constructor() {
        this.drones = [];
        this.droneIdCounter = 1;
        this.baseLocation = { x: 10, y: 10 }; // Centro da cidade
    }

    /**
     * Inicializa os drones com as configurações especificadas
     */
    initializeDrones() {
        const capacity = parseFloat(document.getElementById('droneCapacity').value);
        const range = parseFloat(document.getElementById('droneRange').value);
        const count = parseInt(document.getElementById('droneCount').value);

        // Validações
        if (capacity < 1 || capacity > 20) {
            alert('Capacidade deve estar entre 1kg e 20kg');
            return;
        }
        if (range < 1 || range > 50) {
            alert('Alcance deve estar entre 1km e 50km');
            return;
        }
        if (count < 1 || count > 10) {
            alert('Número de drones deve estar entre 1 e 10');
            return;
        }

        // Limpa drones existentes
        this.drones = [];
        this.droneIdCounter = 1;

        // Cria novos drones
        for (let i = 0; i < count; i++) {
            const drone = new Drone(`DRONE-${this.droneIdCounter}`, capacity, range);
            drone.basePosition = { ...this.baseLocation };
            drone.position = { ...this.baseLocation };
            this.drones.push(drone);
            this.droneIdCounter++;
        }

        console.log(`${count} drones inicializados com capacidade ${capacity}kg e alcance ${range}km`);
        
        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateDroneStatus();
        }
        if (window.mapView) {
            window.mapView.updateMap();
        }
    }

    /**
     * Retorna todos os drones
     * @returns {Array} - Array de drones
     */
    getAllDrones() {
        return this.drones;
    }

    /**
     * Retorna drones disponíveis (não ocupados)
     * @returns {Array} - Array de drones disponíveis
     */
    getAvailableDrones() {
        return this.drones.filter(drone => drone.status === 'idle' && !drone.needsToReturn());
    }

    /**
     * Encontra o melhor drone para um pedido específico
     * @param {Order} order - Pedido a ser atribuído
     * @returns {Drone|null} - Melhor drone ou null se nenhum disponível
     */
    findBestDroneForOrder(order) {
        const availableDrones = this.getAvailableDrones();
        
        if (availableDrones.length === 0) {
            return null;
        }

        let bestDrone = null;
        let bestScore = -1;

        for (const drone of availableDrones) {
            if (!drone.canCarryOrder(order)) {
                continue;
            }

            // Calcula score baseado em distância, capacidade restante e eficiência
            const distanceToOrder = drone.calculateDistance(drone.position, order.location);
            const capacityUtilization = (drone.currentLoad + order.weight) / drone.capacity;
            const efficiency = drone.getEfficiency() || 50; // Default para drones novos

            // Score: menor distância, maior utilização da capacidade, maior eficiência
            const score = (1 / (distanceToOrder + 1)) * capacityUtilization * (efficiency / 100);

            if (score > bestScore) {
                bestScore = score;
                bestDrone = drone;
            }
        }

        return bestDrone;
    }

    /**
     * Atribui um pedido ao melhor drone disponível
     * @param {Order} order - Pedido a ser atribuído
     * @returns {boolean} - True se foi possível atribuir
     */
    assignOrderToDrone(order) {
        const bestDrone = this.findBestDroneForOrder(order);
        
        if (bestDrone) {
            return bestDrone.assignOrder(order);
        }
        
        return false;
    }

    /**
     * Inicia as entregas para todos os drones com pedidos atribuídos
     */
    startAllDeliveries() {
        let deliveriesStarted = 0;
        
        for (const drone of this.drones) {
            if (drone.assignedOrders.length > 0 && drone.status === 'idle') {
                if (drone.startDelivery()) {
                    deliveriesStarted++;
                }
            }
        }
        
        console.log(`${deliveriesStarted} entregas iniciadas`);
        return deliveriesStarted;
    }

    /**
     * Para todas as operações de drones
     */
    stopAllOperations() {
        for (const drone of this.drones) {
            if (drone.status !== 'idle') {
                drone.status = 'returning';
                // Força retorno à base
                setTimeout(() => {
                    drone.completeDelivery();
                }, 1000);
            }
        }
    }

    /**
     * Reseta todos os drones
     */
    resetAllDrones() {
        for (const drone of this.drones) {
            drone.reset();
        }
        
        if (window.uiView) {
            window.uiView.updateDroneStatus();
        }
        if (window.mapView) {
            window.mapView.updateMap();
        }
    }

    /**
     * Encontra um drone pelo ID
     * @param {string} droneId - ID do drone
     * @returns {Drone|null} - Drone encontrado ou null
     */
    getDroneById(droneId) {
        return this.drones.find(drone => drone.id === droneId) || null;
    }

    /**
     * Retorna estatísticas dos drones
     * @returns {Object} - Estatísticas dos drones
     */
    getDroneStatistics() {
        const stats = {
            totalDrones: this.drones.length,
            idleDrones: 0,
            activeDrones: 0,
            totalDeliveries: 0,
            totalDistance: 0,
            averageEfficiency: 0,
            dronesNeedingMaintenance: 0
        };

        let totalEfficiency = 0;
        let dronesWithDeliveries = 0;

        for (const drone of this.drones) {
            if (drone.status === 'idle') {
                stats.idleDrones++;
            } else {
                stats.activeDrones++;
            }

            stats.totalDeliveries += drone.deliveriesCount;
            stats.totalDistance += drone.totalDistance;

            if (drone.deliveriesCount > 0) {
                totalEfficiency += drone.getEfficiency();
                dronesWithDeliveries++;
            }

            if (drone.battery < 30 || drone.needsToReturn()) {
                stats.dronesNeedingMaintenance++;
            }
        }

        if (dronesWithDeliveries > 0) {
            stats.averageEfficiency = Math.round(totalEfficiency / dronesWithDeliveries);
        }

        return stats;
    }

    /**
     * Verifica se há drones com problemas
     * @returns {Array} - Array de problemas encontrados
     */
    checkDroneHealth() {
        const issues = [];

        for (const drone of this.drones) {
            if (drone.battery < 20) {
                issues.push(`${drone.id}: Bateria baixa (${Math.round(drone.battery)}%)`);
            }

            if (drone.status === 'flying' && drone.currentLoad > drone.capacity) {
                issues.push(`${drone.id}: Sobrecarga detectada`);
            }

            if (drone.totalDistance > 1000) {
                issues.push(`${drone.id}: Manutenção recomendada (${drone.totalDistance.toFixed(1)}km percorridos)`);
            }
        }

        return issues;
    }

    /**
     * Otimiza a distribuição de pedidos entre drones
     * @param {Array} orders - Array de pedidos pendentes
     * @returns {Object} - Resultado da otimização
     */
    optimizeOrderDistribution(orders) {
        if (orders.length === 0 || this.getAvailableDrones().length === 0) {
            return { success: false, message: 'Nenhum pedido ou drone disponível' };
        }

        // Ordena pedidos por prioridade e tempo de espera
        const sortedOrders = orders.sort((a, b) => {
            const priorityWeight = { 'alta': 3, 'media': 2, 'baixa': 1 };
            const aPriority = priorityWeight[a.priority];
            const bPriority = priorityWeight[b.priority];
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Maior prioridade primeiro
            }
            
            // Se mesma prioridade, considerar tempo de espera
            return b.getWaitingTime() - a.getWaitingTime(); // Maior tempo de espera primeiro
        });

        let assignedOrders = 0;
        let totalOrders = sortedOrders.length;

        // Atribui pedidos aos drones
        for (const order of sortedOrders) {
            if (order.status === 'pending') {
                if (this.assignOrderToDrone(order)) {
                    assignedOrders++;
                }
            }
        }

        return {
            success: assignedOrders > 0,
            message: `${assignedOrders} de ${totalOrders} pedidos atribuídos`,
            assignedOrders: assignedOrders,
            totalOrders: totalOrders
        };
    }

    /**
     * Simula falhas de drones para testes
     * @param {string} droneId - ID do drone
     * @param {string} failureType - Tipo de falha
     */
    simulateFailure(droneId, failureType = 'battery') {
        const drone = this.getDroneById(droneId);
        if (!drone) return;

        switch (failureType) {
            case 'battery':
                drone.battery = 10;
                break;
            case 'overload':
                drone.currentLoad = drone.capacity + 1;
                break;
            case 'position':
                drone.position = { x: -1, y: -1 }; // Posição inválida
                break;
        }

        console.log(`Falha simulada no ${droneId}: ${failureType}`);
    }

    /**
     * Exporta configurações dos drones
     * @returns {Object} - Configurações para exportação
     */
    exportConfiguration() {
        return {
            baseLocation: this.baseLocation,
            drones: this.drones.map(drone => ({
                id: drone.id,
                capacity: drone.capacity,
                range: drone.range,
                position: drone.position,
                status: drone.status,
                deliveriesCount: drone.deliveriesCount,
                totalDistance: drone.totalDistance
            })),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Importa configurações de drones
     * @param {Object} config - Configurações para importar
     */
    importConfiguration(config) {
        try {
            this.baseLocation = config.baseLocation || { x: 10, y: 10 };
            this.drones = [];
            this.droneIdCounter = 1;

            for (const droneConfig of config.drones || []) {
                const drone = new Drone(droneConfig.id, droneConfig.capacity, droneConfig.range);
                drone.basePosition = { ...this.baseLocation };
                drone.position = droneConfig.position || { ...this.baseLocation };
                drone.status = 'idle'; // Sempre inicia como idle após importar
                drone.deliveriesCount = droneConfig.deliveriesCount || 0;
                drone.totalDistance = droneConfig.totalDistance || 0;
                
                this.drones.push(drone);
                this.droneIdCounter = Math.max(this.droneIdCounter, 
                    parseInt(droneConfig.id.split('-')[1]) + 1);
            }

            console.log('Configuração de drones importada com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao importar configuração:', error);
            return false;
        }
    }
}