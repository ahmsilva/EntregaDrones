/**
 * OptimizationAlgorithm - Algoritmos avançados para otimização de entregas
 * Implementa diferentes estratégias para minimizar viagens e maximizar eficiência
 */
class OptimizationAlgorithm {
    /**
     * Algoritmo principal que combina múltiplas estratégias de otimização
     * @param {Array} orders - Lista de pedidos
     * @param {Array} drones - Lista de drones disponíveis
     * @returns {Object} - Resultado da otimização
     */
    static optimizeDeliveries(orders, drones) {
        if (!orders.length || !drones.length) {
            return { success: false, message: 'Sem pedidos ou drones disponíveis' };
        }

        // Etapa 1: Análise inicial dos dados
        const analysis = this.analyzeDeliveryScenario(orders, drones);
        
        // Etapa 2: Seleção da estratégia baseada na análise
        const strategy = this.selectOptimizationStrategy(analysis);
        
        // Etapa 3: Aplicação da estratégia selecionada
        const result = this.applyOptimizationStrategy(orders, drones, strategy);
        
        return result;
    }

    /**
     * Analisa o cenário atual para escolher a melhor estratégia
     * @param {Array} orders - Pedidos pendentes
     * @param {Array} drones - Drones disponíveis
     * @returns {Object} - Análise do cenário
     */
    static analyzeDeliveryScenario(orders, drones) {
        const totalWeight = orders.reduce((sum, order) => sum + order.weight, 0);
        const totalCapacity = drones.reduce((sum, drone) => sum + drone.capacity, 0);
        const avgOrderDistance = this.calculateAverageDistanceFromBase(orders);
        const highPriorityCount = orders.filter(o => o.priority === 'alta').length;
        
        return {
            orderCount: orders.length,
            droneCount: drones.length,
            capacityUtilization: totalWeight / totalCapacity,
            avgDistance: avgOrderDistance,
            priorityRatio: highPriorityCount / orders.length,
            isHighVolume: orders.length > drones.length * 3,
            isHighPriority: highPriorityCount > orders.length * 0.5
        };
    }

    /**
     * Seleciona a estratégia de otimização baseada na análise
     * @param {Object} analysis - Análise do cenário
     * @returns {string} - Estratégia selecionada
     */
    static selectOptimizationStrategy(analysis) {
        if (analysis.isHighPriority) {
            return 'priority_first';
        } else if (analysis.isHighVolume) {
            return 'capacity_optimization';
        } else if (analysis.avgDistance > 10) {
            return 'distance_optimization';
        } else {
            return 'balanced_optimization';
        }
    }

    /**
     * Aplica a estratégia de otimização selecionada
     * @param {Array} orders - Pedidos
     * @param {Array} drones - Drones
     * @param {string} strategy - Estratégia a aplicar
     * @returns {Object} - Resultado da otimização
     */
    static applyOptimizationStrategy(orders, drones, strategy) {
        switch (strategy) {
            case 'priority_first':
                return this.priorityFirstOptimization(orders, drones);
            case 'capacity_optimization':
                return this.capacityOptimization(orders, drones);
            case 'distance_optimization':
                return this.distanceOptimization(orders, drones);
            default:
                return this.balancedOptimization(orders, drones);
        }
    }

    /**
     * Otimização focada em prioridade (pedidos alta prioridade primeiro)
     * @param {Array} orders - Pedidos
     * @param {Array} drones - Drones
     * @returns {Object} - Resultado
     */
    static priorityFirstOptimization(orders, drones) {
        const sortedOrders = orders.sort((a, b) => {
            const priorityScores = { 'alta': 100, 'media': 50, 'baixa': 10 };
            const priorityDiff = priorityScores[b.priority] - priorityScores[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            return b.getWaitingTime() - a.getWaitingTime();
        });

        return this.greedyAssignment(sortedOrders, drones);
    }

    /**
     * Otimização focada em maximizar uso da capacidade
     * @param {Array} orders - Pedidos
     * @param {Array} drones - Drones
     * @returns {Object} - Resultado
     */
    static capacityOptimization(orders, drones) {
        const assignments = [];
        const availableDrones = [...drones.filter(d => d.status === 'idle')];
        const pendingOrders = [...orders.filter(o => o.status === 'pending')];

        for (const drone of availableDrones) {
            const bestCombination = this.findBestOrderCombination(pendingOrders, drone);
            
            if (bestCombination.length > 0) {
                bestCombination.forEach(order => {
                    if (drone.assignOrder(order)) {
                        pendingOrders.splice(pendingOrders.indexOf(order), 1);
                    }
                });
                assignments.push({
                    drone: drone.id,
                    orders: bestCombination.map(o => o.id),
                    totalWeight: bestCombination.reduce((sum, o) => sum + o.weight, 0)
                });
            }
        }

        return {
            success: assignments.length > 0,
            message: `${assignments.length} drones otimizados por capacidade`,
            assignments: assignments,
            strategy: 'capacity_optimization'
        };
    }

    /**
     * Encontra a melhor combinação de pedidos para um drone
     * @param {Array} orders - Pedidos disponíveis
     * @param {Drone} drone - Drone para otimizar
     * @returns {Array} - Melhor combinação de pedidos
     */
    static findBestOrderCombination(orders, drone) {
        const validOrders = orders.filter(order => drone.canCarryOrder(order));
        
        if (validOrders.length === 0) return [];

        // Algoritmo guloso modificado para máxima utilização da capacidade
        const combination = [];
        let remainingCapacity = drone.capacity - drone.currentLoad;
        let remainingOrders = [...validOrders];

        // Ordena por eficiência (peso/prioridade)
        remainingOrders.sort((a, b) => {
            const aScore = this.calculateOrderEfficiencyScore(a, drone);
            const bScore = this.calculateOrderEfficiencyScore(b, drone);
            return bScore - aScore;
        });

        for (const order of remainingOrders) {
            if (order.weight <= remainingCapacity) {
                combination.push(order);
                remainingCapacity -= order.weight;
            }
        }

        return combination;
    }

    /**
     * Calcula score de eficiência para um pedido
     * @param {Order} order - Pedido
     * @param {Drone} drone - Drone
     * @returns {number} - Score de eficiência
     */
    static calculateOrderEfficiencyScore(order, drone) {
        const priorityWeight = { 'alta': 3, 'media': 2, 'baixa': 1 };
        const distance = drone.calculateDistance(drone.position, order.location);
        const timeWeight = Math.min(order.getWaitingTime() / 30, 2); // Máximo 2x por tempo de espera
        
        return (priorityWeight[order.priority] + timeWeight) / (distance + 0.1);
    }

    /**
     * Otimização focada em minimizar distância total
     * @param {Array} orders - Pedidos
     * @param {Array} drones - Drones
     * @returns {Object} - Resultado
     */
    static distanceOptimization(orders, drones) {
        const clusters = this.clusterOrdersByDistance(orders, drones.length);
        const assignments = [];

        for (let i = 0; i < Math.min(clusters.length, drones.length); i++) {
            const drone = drones[i];
            const cluster = clusters[i];
            
            // Ordena cluster por prioridade
            cluster.sort((a, b) => {
                const priorityScores = { 'alta': 3, 'media': 2, 'baixa': 1 };
                return priorityScores[b.priority] - priorityScores[a.priority];
            });

            const assignedOrders = [];
            for (const order of cluster) {
                if (drone.canCarryOrder(order) && drone.assignOrder(order)) {
                    assignedOrders.push(order);
                }
            }

            if (assignedOrders.length > 0) {
                assignments.push({
                    drone: drone.id,
                    orders: assignedOrders.map(o => o.id),
                    clusterDistance: this.calculateClusterDistance(assignedOrders)
                });
            }
        }

        return {
            success: assignments.length > 0,
            message: `${assignments.length} drones otimizados por distância`,
            assignments: assignments,
            strategy: 'distance_optimization'
        };
    }

    /**
     * Agrupa pedidos por proximidade usando k-means simplificado
     * @param {Array} orders - Pedidos
     * @param {number} k - Número de clusters
     * @returns {Array} - Array de clusters
     */
    static clusterOrdersByDistance(orders, k) {
        if (orders.length <= k) {
            return orders.map(order => [order]);
        }

        // Inicializa centroides aleatoriamente
        const centroids = [];
        for (let i = 0; i < k; i++) {
            const randomOrder = orders[Math.floor(Math.random() * orders.length)];
            centroids.push({ ...randomOrder.location });
        }

        // Executa k-means simplificado (3 iterações)
        for (let iteration = 0; iteration < 3; iteration++) {
            const clusters = Array(k).fill().map(() => []);

            // Atribui cada pedido ao centroide mais próximo
            for (const order of orders) {
                let nearestCentroid = 0;
                let nearestDistance = this.calculateDistance(order.location, centroids[0]);

                for (let i = 1; i < centroids.length; i++) {
                    const distance = this.calculateDistance(order.location, centroids[i]);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestCentroid = i;
                    }
                }

                clusters[nearestCentroid].push(order);
            }

            // Atualiza centroides
            for (let i = 0; i < centroids.length; i++) {
                if (clusters[i].length > 0) {
                    const avgX = clusters[i].reduce((sum, o) => sum + o.location.x, 0) / clusters[i].length;
                    const avgY = clusters[i].reduce((sum, o) => sum + o.location.y, 0) / clusters[i].length;
                    centroids[i] = { x: avgX, y: avgY };
                }
            }
        }

        // Retorna clusters finais
        const finalClusters = Array(k).fill().map(() => []);
        for (const order of orders) {
            let nearestCentroid = 0;
            let nearestDistance = this.calculateDistance(order.location, centroids[0]);

            for (let i = 1; i < centroids.length; i++) {
                const distance = this.calculateDistance(order.location, centroids[i]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCentroid = i;
                }
            }

            finalClusters[nearestCentroid].push(order);
        }

        return finalClusters.filter(cluster => cluster.length > 0);
    }

    /**
     * Otimização balanceada que considera múltiplos fatores
     * @param {Array} orders - Pedidos
     * @param {Array} drones - Drones
     * @returns {Object} - Resultado
     */
    static balancedOptimization(orders, drones) {
        // Combina múltiplos critérios: prioridade, distância e capacidade
        const scoredOrders = orders.map(order => ({
            order: order,
            score: this.calculateBalancedScore(order, drones)
        }));

        scoredOrders.sort((a, b) => b.score - a.score);
        return this.greedyAssignment(scoredOrders.map(item => item.order), drones);
    }

    /**
     * Calcula score balanceado para um pedido
     * @param {Order} order - Pedido
     * @param {Array} drones - Drones disponíveis
     * @returns {number} - Score balanceado
     */
    static calculateBalancedScore(order, drones) {
        const priorityWeight = { 'alta': 100, 'media': 50, 'baixa': 10 };
        const timeBonus = Math.min(order.getWaitingTime() * 2, 50);
        
        // Encontra a menor distância para qualquer drone disponível
        const minDistance = Math.min(...drones.map(drone => 
            drone.calculateDistance(drone.position, order.location)
        ));
        
        const distancePenalty = minDistance * 5;
        
        return priorityWeight[order.priority] + timeBonus - distancePenalty;
    }

    /**
     * Algoritmo guloso de atribuição
     * @param {Array} orders - Pedidos ordenados
     * @param {Array} drones - Drones disponíveis
     * @returns {Object} - Resultado da atribuição
     */
    static greedyAssignment(orders, drones) {
        const assignments = [];
        const availableDrones = drones.filter(d => d.status === 'idle');
        let assignedOrdersCount = 0;

        for (const order of orders) {
            if (order.status !== 'pending') continue;

            // Encontra o melhor drone para este pedido
            let bestDrone = null;
            let bestScore = -1;

            for (const drone of availableDrones) {
                if (drone.canCarryOrder(order)) {
                    const score = this.calculateAssignmentScore(order, drone);
                    if (score > bestScore) {
                        bestScore = score;
                        bestDrone = drone;
                    }
                }
            }

            if (bestDrone && bestDrone.assignOrder(order)) {
                assignedOrdersCount++;
                
                // Registra atribuição se é o primeiro pedido do drone
                if (bestDrone.assignedOrders.length === 1) {
                    assignments.push({
                        drone: bestDrone.id,
                        orders: [order.id]
                    });
                } else {
                    // Atualiza atribuição existente
                    const existingAssignment = assignments.find(a => a.drone === bestDrone.id);
                    if (existingAssignment) {
                        existingAssignment.orders.push(order.id);
                    }
                }
            }
        }

        return {
            success: assignedOrdersCount > 0,
            message: `${assignedOrdersCount} pedidos atribuídos usando algoritmo guloso`,
            assignments: assignments,
            strategy: 'greedy_assignment'
        };
    }

    /**
     * Calcula score para atribuição de pedido a drone
     * @param {Order} order - Pedido
     * @param {Drone} drone - Drone
     * @returns {number} - Score de atribuição
     */
    static calculateAssignmentScore(order, drone) {
        const distance = drone.calculateDistance(drone.position, order.location);
        const capacityUtilization = (drone.currentLoad + order.weight) / drone.capacity;
        const batteryFactor = drone.battery / 100;
        
        // Score maior para menor distância, maior utilização de capacidade e melhor bateria
        return (capacityUtilization * batteryFactor) / (distance + 0.1);
    }

    /**
     * Calcula a distância média dos pedidos da base
     * @param {Array} orders - Pedidos
     * @returns {number} - Distância média
     */
    static calculateAverageDistanceFromBase(orders) {
        if (orders.length === 0) return 0;
        
        const basePosition = { x: 10, y: 10 };
        const totalDistance = orders.reduce((sum, order) => {
            return sum + this.calculateDistance(order.location, basePosition);
        }, 0);
        
        return totalDistance / orders.length;
    }

    /**
     * Calcula a distância total de um cluster de pedidos
     * @param {Array} orders - Pedidos do cluster
     * @returns {number} - Distância total
     */
    static calculateClusterDistance(orders) {
        if (orders.length <= 1) return 0;

        let totalDistance = 0;
        const basePosition = { x: 10, y: 10 };
        
        // Distância da base ao primeiro pedido
        totalDistance += this.calculateDistance(basePosition, orders[0].location);
        
        // Distâncias entre pedidos consecutivos
        for (let i = 1; i < orders.length; i++) {
            totalDistance += this.calculateDistance(orders[i-1].location, orders[i].location);
        }
        
        // Distância do último pedido de volta à base
        totalDistance += this.calculateDistance(orders[orders.length - 1].location, basePosition);
        
        return totalDistance;
    }

    /**
     * Calcula distância euclidiana entre dois pontos
     * @param {Object} point1 - Ponto 1 {x, y}
     * @param {Object} point2 - Ponto 2 {x, y}
     * @returns {number} - Distância
     */
    static calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Otimiza rotas usando algoritmo 2-opt
     * @param {Array} route - Rota atual
     * @returns {Array} - Rota otimizada
     */
    static optimizeRouteWith2Opt(route) {
        if (route.length < 4) return route;

        let bestRoute = [...route];
        let bestDistance = this.calculateRouteDistance(route);
        let improved = true;

        while (improved) {
            improved = false;
            
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    // Tenta reversão do segmento
                    const newRoute = [...route];
                    this.reverseRouteSegment(newRoute, i, j);
                    
                    const newDistance = this.calculateRouteDistance(newRoute);
                    if (newDistance < bestDistance) {
                        bestRoute = newRoute;
                        bestDistance = newDistance;
                        improved = true;
                    }
                }
            }
            
            route = bestRoute;
        }

        return bestRoute;
    }

    /**
     * Reverte um segmento da rota
     * @param {Array} route - Rota
     * @param {number} start - Índice inicial
     * @param {number} end - Índice final
     */
    static reverseRouteSegment(route, start, end) {
        while (start < end) {
            const temp = route[start];
            route[start] = route[end];
            route[end] = temp;
            start++;
            end--;
        }
    }

    /**
     * Calcula a distância total de uma rota
     * @param {Array} route - Rota (array de posições)
     * @returns {number} - Distância total
     */
    static calculateRouteDistance(route) {
        if (route.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.calculateDistance(route[i], route[i + 1]);
        }
        
        return totalDistance;
    }
}