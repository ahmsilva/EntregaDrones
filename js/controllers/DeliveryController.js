/**
 * DeliveryController - Controlador principal do sistema de entregas
 * Coordena drones, pedidos e otimização de entregas
 */
class DeliveryController {
    constructor() {
        this.isSimulationRunning = false;
        this.simulationInterval = null;
        this.totalTrips = 0;
        this.completedDeliveries = 0;
        this.systemStartTime = null;
    }


    initialize() {
        console.log('Sistema de Entrega de Drones inicializado');
        
        // Inicializa com configurações padrão
        if (window.droneController && window.droneController.drones.length === 0) {
            // Define valores padrão nos campos
            document.getElementById('droneCapacity').value = '5';
            document.getElementById('droneRange').value = '10';
            document.getElementById('droneCount').value = '3';
            
            window.droneController.initializeDrones();
        }

        this.systemStartTime = new Date();
    }

    /**
     * Otimiza e atribui entregas usando algoritmos inteligentes
     * @returns {Object} - Resultado da otimização
     */
    optimizeDeliveries() {
        console.log('Iniciando otimização de entregas...');

        if (!window.orderController || !window.droneController) {
            return {
                success: false,
                message: 'Controladores não inicializados'
            };
        }

        const pendingOrders = window.orderController.getPendingOrders();
        const availableDrones = window.droneController.getAvailableDrones();

        if (pendingOrders.length === 0) {
            return {
                success: false,
                message: 'Nenhum pedido pendente para otimizar'
            };
        }

        if (availableDrones.length === 0) {
            return {
                success: false,
                message: 'Nenhum drone disponível'
            };
        }


        const optimizationResult = this.performAdvancedOptimization(pendingOrders, availableDrones);

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateOrdersList();
            window.uiView.updateDroneStatus();
            window.uiView.updateStatistics();
        }

        if (window.mapView) {
            window.mapView.updateMap();
        }

        console.log('Otimização concluída:', optimizationResult);
        return optimizationResult;
    }

    /**
     * Algoritmo avançado de otimização que minimiza o número de viagens
     * @param {Array} orders - Pedidos pendentes
     * @param {Array} drones - Drones disponíveis
     * @returns {Object} - Resultado da otimização
     */
    performAdvancedOptimization(orders, drones) {
        // Etapa 1: Ordena pedidos por prioridade e urgência
        const sortedOrders = this.prioritizeOrders(orders);
        
        // Etapa 2: Agrupa pedidos próximos
        const orderGroups = this.createOptimalGroups(sortedOrders, drones);
        
        // Etapa 3: Atribui grupos aos drones de forma otimizada
        const assignmentResult = this.assignGroupsToDrones(orderGroups, drones);
        
        return assignmentResult;
    }

    /**
     * Prioriza pedidos baseado em múltiplos critérios
     * @param {Array} orders - Lista de pedidos
     * @returns {Array} - Pedidos ordenados por prioridade
     */
    prioritizeOrders(orders) {
        return orders.sort((a, b) => {
            // Critério 1: Prioridade do pedido
            const priorityScores = { 'alta': 100, 'media': 50, 'baixa': 10 };
            const priorityDiff = priorityScores[b.priority] - priorityScores[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Critério 2: Tempo de espera (pedidos mais antigos primeiro)
            const timeDiff = b.getWaitingTime() - a.getWaitingTime();
            if (timeDiff !== 0) return timeDiff;
            
            // Critério 3: Peso (pedidos mais leves primeiro para facilitar agrupamento)
            return a.weight - b.weight;
        });
    }

    /**
     * Cria grupos ótimos de pedidos para minimizar viagens
     * @param {Array} orders - Pedidos ordenados
     * @param {Array} drones - Drones disponíveis
     * @returns {Array} - Grupos de pedidos
     */
    createOptimalGroups(orders, drones) {
        const groups = [];
        const unassigned = [...orders];
        const maxCapacity = Math.max(...drones.map(d => d.capacity));
        const maxRange = Math.max(...drones.map(d => d.range));

        while (unassigned.length > 0) {
            const group = [];
            let currentWeight = 0;
            let basePosition = { x: 10, y: 10 }; // Base dos drones

            // Pega o primeiro pedido (maior prioridade)
            const firstOrder = unassigned.shift();
            group.push(firstOrder);
            currentWeight += firstOrder.weight;

            let lastPosition = firstOrder.location;

            // Tenta adicionar pedidos próximos que cabem na capacidade e alcance
            for (let i = unassigned.length - 1; i >= 0; i--) {
                const candidateOrder = unassigned[i];
                const newWeight = currentWeight + candidateOrder.weight;

                if (newWeight > maxCapacity) continue;

                // Calcula distância total se adicionar este pedido
                const distanceToCandidate = this.calculateDistance(lastPosition, candidateOrder.location);
                const distanceToBase = this.calculateDistance(candidateOrder.location, basePosition);
                const totalGroupDistance = this.calculateGroupDistance([...group, candidateOrder], basePosition);

                if (totalGroupDistance > maxRange) continue;

                // Se passou nas validações, adiciona ao grupo
                group.push(candidateOrder);
                currentWeight = newWeight;
                lastPosition = candidateOrder.location;
                unassigned.splice(i, 1);
            }

            groups.push(group);
        }

        console.log(`Criados ${groups.length} grupos de pedidos`);
        return groups;
    }

    /**
     * Calcula a distância total de um grupo de pedidos
     * @param {Array} orders - Pedidos do grupo
     * @param {Object} basePosition - Posição da base
     * @returns {number} - Distância total
     */
    calculateGroupDistance(orders, basePosition) {
        if (orders.length === 0) return 0;

        let totalDistance = 0;
        let currentPosition = basePosition;

        // Otimiza a ordem dos pedidos no grupo (algoritmo nearest neighbor)
        const unvisited = [...orders];
        const route = [];

        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistance(currentPosition, unvisited[0].location);

            for (let i = 1; i < unvisited.length; i++) {
                const distance = this.calculateDistance(currentPosition, unvisited[i].location);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            const nearestOrder = unvisited.splice(nearestIndex, 1)[0];
            route.push(nearestOrder);
            totalDistance += this.calculateDistance(currentPosition, nearestOrder.location);
            currentPosition = nearestOrder.location;
        }

        // Adiciona distância de retorno à base
        totalDistance += this.calculateDistance(currentPosition, basePosition);
        return totalDistance;
    }

    /**
     * Calcula distância euclidiana entre dois pontos
     * @param {Object} point1 - Ponto 1
     * @param {Object} point2 - Ponto 2
     * @returns {number} - Distância
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Atribui grupos de pedidos aos drones de forma otimizada
     * @param {Array} groups - Grupos de pedidos
     * @param {Array} drones - Drones disponíveis
     * @returns {Object} - Resultado da atribuição
     */
    assignGroupsToDrones(groups, drones) {
        let assignedGroups = 0;
        let totalOrders = 0;
        let assignedOrders = 0;

        // Conta total de pedidos
        groups.forEach(group => totalOrders += group.length);

        // Ordena grupos por prioridade (grupos com pedidos de alta prioridade primeiro)
        const sortedGroups = groups.sort((a, b) => {
            const aMaxPriority = Math.max(...a.map(o => o.getPriorityScore()));
            const bMaxPriority = Math.max(...b.map(o => o.getPriorityScore()));
            return bMaxPriority - aMaxPriority;
        });

        for (const group of sortedGroups) {
            // Encontra o melhor drone para este grupo
            const bestDrone = this.findBestDroneForGroup(group, drones);

            if (bestDrone) {
                // Atribui todos os pedidos do grupo ao drone
                let groupAssigned = true;
                for (const order of group) {
                    if (!bestDrone.assignOrder(order)) {
                        groupAssigned = false;
                        break;
                    }
                }

                if (groupAssigned) {
                    assignedGroups++;
                    assignedOrders += group.length;
                    this.totalTrips++;
                }
            }
        }

        return {
            success: assignedOrders > 0,
            message: `${assignedOrders} de ${totalOrders} pedidos atribuídos em ${assignedGroups} viagens`,
            assignedOrders: assignedOrders,
            totalOrders: totalOrders,
            totalTrips: assignedGroups,
            efficiency: totalOrders > 0 ? Math.round((assignedOrders / totalOrders) * 100) : 0
        };
    }

    /**
     * Encontra o melhor drone para um grupo de pedidos
     * @param {Array} group - Grupo de pedidos
     * @param {Array} drones - Drones disponíveis
     * @returns {Drone|null} - Melhor drone ou null
     */
    findBestDroneForGroup(group, drones) {
        let bestDrone = null;
        let bestScore = -1;
        const basePosition = { x: 10, y: 10 };

        for (const drone of drones) {
            if (drone.status !== 'idle') continue;

            // Verifica se o drone pode carregar todos os pedidos do grupo
            const totalWeight = group.reduce((sum, order) => sum + order.weight, 0);
            if (drone.currentLoad + totalWeight > drone.capacity) continue;

            // Verifica se o drone pode alcançar todos os pedidos
            const totalDistance = this.calculateGroupDistance(group, basePosition);
            if (totalDistance > drone.range) continue;

            // Calcula score baseado em eficiência e proximidade
            const avgDistance = totalDistance / group.length;
            const capacityUtilization = (drone.currentLoad + totalWeight) / drone.capacity;
            const score = capacityUtilization / (avgDistance + 1);

            if (score > bestScore) {
                bestScore = score;
                bestDrone = drone;
            }
        }

        return bestDrone;
    }

    /**
     * Inicia a simulação de entregas
     */
    startSimulation() {
        if (this.isSimulationRunning) {
            console.log('Simulação já está rodando');
            return false;
        }

        // Verifica se há drones com pedidos atribuídos
        if (!window.droneController) {
            console.error('DroneController não disponível');
            return false;
        }

        const dronesWithOrders = window.droneController.getAllDrones()
            .filter(drone => drone.assignedOrders.length > 0);

        if (dronesWithOrders.length === 0) {
            // Se não há pedidos atribuídos, tenta otimizar primeiro
            const optimizationResult = this.optimizeDeliveries();
            
            if (!optimizationResult.success) {
                console.log('Não foi possível iniciar a simulação: ' + optimizationResult.message);
                return false;
            }

            // Verifica novamente após otimização
            const updatedDronesWithOrders = window.droneController.getAllDrones()
                .filter(drone => drone.assignedOrders.length > 0);
                
            if (updatedDronesWithOrders.length === 0) {
                console.log('Nenhum drone tem pedidos atribuídos após otimização');
                return false;
            }
        }

        // Inicia as entregas dos drones
        const deliveriesStarted = window.droneController.startAllDeliveries();
        
        if (deliveriesStarted === 0) {
            console.log('Nenhuma entrega foi iniciada');
            return false;
        }

        this.isSimulationRunning = true;
        console.log('Simulação iniciada com ' + deliveriesStarted + ' entregas');

        // Monitora o progresso da simulação
        this.simulationInterval = setInterval(() => {
            this.updateSimulationProgress();
        }, 1000);

        // Atualiza botões da interface
        this.updateSimulationButtons();
        
        return true;
    }

    /**
     * Atualiza o progresso da simulação
     */
    updateSimulationProgress() {
        // Verifica se ainda há drones ativos
        const activeDrones = window.droneController.getAllDrones().filter(d => d.status !== 'idle');
        
        if (activeDrones.length === 0) {
            this.stopSimulation();
            return;
        }

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateDroneStatus();
            window.uiView.updateOrdersList();
            window.uiView.updateStatistics();
        }
        
        // Atualiza mapa para remover pedidos entregues
        if (window.mapView) {
            window.mapView.updateMap();
        }

        // Conta entregas completadas
        this.completedDeliveries = window.orderController.getDeliveredOrders().length;
    }

    /**
     * Para a simulação
     */
    stopSimulation() {
        if (!this.isSimulationRunning) return;

        this.isSimulationRunning = false;
        
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }

        console.log('Simulação finalizada');
        this.updateSimulationButtons();

        // Atualiza estatísticas finais
        if (window.uiView) {
            window.uiView.updateStatistics();
        }
    }

    /**
     * Reseta o sistema completo
     */
    resetSystem() {
        // Para simulação se estiver rodando
        this.stopSimulation();

        // Reseta controladores
        if (window.droneController) {
            window.droneController.resetAllDrones();
        }

        if (window.orderController) {
            window.orderController.clearAllOrders();
        }

        // Reseta estatísticas
        this.totalTrips = 0;
        this.completedDeliveries = 0;
        this.systemStartTime = new Date();

        console.log('Sistema resetado');

        // Atualiza interface
        if (window.uiView) {
            window.uiView.updateDroneStatus();
            window.uiView.updateOrdersList();
            window.uiView.updateStatistics();
        }

        if (window.mapView) {
            window.mapView.updateMap();
        }
    }

    /**
     * Atualiza os botões da simulação na interface
     */
    updateSimulationButtons() {
        const startBtn = document.querySelector('.btn-warning');
        const optimizeBtn = document.querySelector('.btn-success');
        
        if (startBtn) {
            if (this.isSimulationRunning) {
                startBtn.textContent = 'Parar Simulação';
                startBtn.onclick = () => this.stopSimulation();
            } else {
                startBtn.textContent = 'Iniciar Simulação';
                startBtn.onclick = () => this.startSimulation();
            }
        }

        if (optimizeBtn) {
            optimizeBtn.disabled = this.isSimulationRunning;
        }
    }

    /**
     * Retorna estatísticas do sistema de entrega
     * @returns {Object} - Estatísticas do sistema
     */
    getSystemStatistics() {
        const orderStats = window.orderController ? window.orderController.getOrderStatistics() : {};
        const droneStats = window.droneController ? window.droneController.getDroneStatistics() : {};
        
        const uptime = this.systemStartTime ? 
            Math.floor((new Date() - this.systemStartTime) / 1000 / 60) : 0; // em minutos

        return {
            ...orderStats,
            ...droneStats,
            totalTrips: this.totalTrips,
            completedDeliveries: this.completedDeliveries,
            isSimulationRunning: this.isSimulationRunning,
            systemUptime: uptime,
            efficiency: orderStats.totalOrders > 0 ? 
                Math.round((orderStats.deliveredOrders / orderStats.totalOrders) * 100) : 0
        };
    }

    /**
     * Gera relatório detalhado do sistema
     * @returns {Object} - Relatório completo
     */
    generateReport() {
        const stats = this.getSystemStatistics();
        const droneIssues = window.droneController ? window.droneController.checkDroneHealth() : [];
        
        return {
            timestamp: new Date().toISOString(),
            statistics: stats,
            droneHealth: {
                issues: droneIssues,
                healthScore: droneIssues.length === 0 ? 100 : Math.max(0, 100 - (droneIssues.length * 20))
            },
            recommendations: this.generateRecommendations(stats, droneIssues)
        };
    }

    /**
     * Gera recomendações baseadas nas estatísticas atuais
     * @param {Object} stats - Estatísticas do sistema
     * @param {Array} issues - Problemas dos drones
     * @returns {Array} - Lista de recomendações
     */
    generateRecommendations(stats, issues) {
        const recommendations = [];

        if (stats.efficiency < 70) {
            recommendations.push('Considere adicionar mais drones para melhorar a eficiência');
        }

        if (stats.overdueOrders > 0) {
            recommendations.push(`${stats.overdueOrders} pedidos estão atrasados - priorize entregas de alta prioridade`);
        }

        if (stats.averageDeliveryTime > 30) {
            recommendations.push('Tempo médio de entrega está alto - otimize as rotas');
        }

        if (issues.length > 0) {
            recommendations.push('Alguns drones precisam de manutenção - verifique o status');
        }

        if (stats.pendingOrders > stats.totalDrones * 3) {
            recommendations.push('Muitos pedidos pendentes - considere aumentar a frota');
        }

        return recommendations;
    }
}