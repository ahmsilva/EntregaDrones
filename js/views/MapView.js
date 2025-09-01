/**
 * MapView - Visualização do mapa da cidade com drones, pedidos e rotas
 * Responsável por renderizar elementos visuais no mapa 2D
 */
class MapView {
    constructor(mapElementId) {
        this.mapElement = document.getElementById(mapElementId);
        this.mapSize = { width: 21, height: 21 }; // Grade 21x21 (0-20)
        this.scale = 1;
        this.basePosition = { x: 10, y: 10 };
        this.elements = new Map(); // Cache de elementos do DOM
        
        this.initializeMap();
    }

    /**
     * Inicializa o mapa e configurações básicas
     */
    initializeMap() {
        if (!this.mapElement) {
            console.error('Elemento do mapa não encontrado');
            return;
        }

        // Define o tamanho do mapa baseado no container
        const rect = this.mapElement.getBoundingClientRect();
        this.scale = Math.min(rect.width, rect.height) / 21;
        
        // Limpa o mapa
        this.clearMap();
        
        // Adiciona a base dos drones
        this.addBaseElement();
        
        console.log('Mapa inicializado com escala:', this.scale);
    }

    /**
     * Limpa todos os elementos do mapa
     */
    clearMap() {
        if (this.mapElement) {
            this.mapElement.innerHTML = '';
        }
        this.elements.clear();
    }

    /**
     * Adiciona o elemento da base no mapa
     */
    addBaseElement() {
        const baseElement = document.createElement('div');
        baseElement.className = 'map-element base-element';
        baseElement.title = 'Base dos Drones';
        baseElement.textContent = 'B';
        
        this.positionElement(baseElement, this.basePosition);
        this.mapElement.appendChild(baseElement);
        
        this.elements.set('base', baseElement);
    }

    /**
     * Posiciona um elemento no mapa baseado nas coordenadas
     * @param {HTMLElement} element - Elemento a ser posicionado
     * @param {Object} position - Posição {x, y}
     */
    positionElement(element, position) {
        const pixelX = (position.x / 20) * (this.mapElement.clientWidth - 24);
        const pixelY = (position.y / 20) * (this.mapElement.clientHeight - 24);
        
        element.style.left = `${pixelX}px`;
        element.style.top = `${pixelY}px`;
    }

    /**
     * Adiciona um pedido no mapa
     * @param {Order} order - Pedido a ser adicionado
     */
    addOrderElement(order) {
        const orderElement = document.createElement('div');
        orderElement.className = `map-element order-element ${order.priority}`;
        orderElement.title = `Pedido ${order.id} - ${order.priority} prioridade - ${order.weight}kg`;
        orderElement.textContent = order.id.split('-')[1]; // Número do pedido
        
        // Cor baseada no status
        if (order.status === 'assigned') {
            orderElement.style.opacity = '0.7';
            orderElement.style.border = '2px solid #3b82f6';
        } else if (order.status === 'delivered') {
            orderElement.style.opacity = '0.3';
            orderElement.style.backgroundColor = '#10b981';
        }
        
        this.positionElement(orderElement, order.location);
        this.mapElement.appendChild(orderElement);
        
        this.elements.set(`order-${order.id}`, orderElement);
        
        // Adiciona evento de clique para mostrar detalhes
        orderElement.addEventListener('click', () => {
            this.showOrderDetails(order);
        });
    }

    /**
     * Adiciona um drone no mapa
     * @param {Drone} drone - Drone a ser adicionado
     */
    addDroneElement(drone) {
        const droneElement = document.createElement('div');
        droneElement.className = 'map-element drone-element';
        droneElement.title = `${drone.id} - Status: ${drone.status} - Bateria: ${Math.round(drone.battery)}%`;
        droneElement.textContent = drone.id.split('-')[1]; // Número do drone
        
        // Cor baseada no status
        switch (drone.status) {
            case 'idle':
                droneElement.style.backgroundColor = '#10b981';
                break;
            case 'loading':
                droneElement.style.backgroundColor = '#f59e0b';
                break;
            case 'flying':
                droneElement.style.backgroundColor = '#3b82f6';
                break;
            case 'delivering':
                droneElement.style.backgroundColor = '#ec4899';
                break;
            case 'returning':
                droneElement.style.backgroundColor = '#8b5cf6';
                break;
        }
        
        this.positionElement(droneElement, drone.position);
        this.mapElement.appendChild(droneElement);
        
        this.elements.set(`drone-${drone.id}`, droneElement);
        
        // Adiciona evento de clique para mostrar detalhes
        droneElement.addEventListener('click', () => {
            this.showDroneDetails(drone);
        });
    }

    /**
     * Atualiza a posição de um drone no mapa
     * @param {Drone} drone - Drone a ser atualizado
     */
    updateDronePosition(drone) {
        const droneElement = this.elements.get(`drone-${drone.id}`);
        if (droneElement) {
            this.positionElement(droneElement, drone.position);
            droneElement.title = `${drone.id} - Status: ${drone.status} - Bateria: ${Math.round(drone.battery)}%`;
            
            // Atualiza cor baseada no status
            switch (drone.status) {
                case 'idle':
                    droneElement.style.backgroundColor = '#10b981';
                    break;
                case 'loading':
                    droneElement.style.backgroundColor = '#f59e0b';
                    break;
                case 'flying':
                    droneElement.style.backgroundColor = '#3b82f6';
                    break;
                case 'delivering':
                    droneElement.style.backgroundColor = '#ec4899';
                    break;
                case 'returning':
                    droneElement.style.backgroundColor = '#8b5cf6';
                    break;
            }
        }
    }

    /**
     * Desenha a rota de um drone no mapa
     * @param {Drone} drone - Drone com rota a ser desenhada
     */
    drawDroneRoute(drone) {
        // Remove rotas antigas do drone
        this.clearDroneRoute(drone);
        
        if (!drone.currentRoute || drone.currentRoute.length < 2) {
            return;
        }
        
        // Desenha linhas conectando os pontos da rota
        for (let i = 0; i < drone.currentRoute.length - 1; i++) {
            const startPoint = drone.currentRoute[i];
            const endPoint = drone.currentRoute[i + 1];
            
            const routeLine = this.createRouteLine(startPoint, endPoint);
            routeLine.dataset.droneId = drone.id;
            routeLine.dataset.routeSegment = i;
            
            this.mapElement.appendChild(routeLine);
        }
    }

    /**
     * Cria uma linha de rota entre dois pontos
     * @param {Object} start - Ponto inicial
     * @param {Object} end - Ponto final
     * @returns {HTMLElement} - Elemento da linha
     */
    createRouteLine(start, end) {
        const line = document.createElement('div');
        line.className = 'route-line';
        
        const startPixel = {
            x: (start.x / 20) * (this.mapElement.clientWidth - 24) + 12,
            y: (start.y / 20) * (this.mapElement.clientHeight - 24) + 12
        };
        
        const endPixel = {
            x: (end.x / 20) * (this.mapElement.clientWidth - 24) + 12,
            y: (end.y / 20) * (this.mapElement.clientHeight - 24) + 12
        };
        
        const dx = endPixel.x - startPixel.x;
        const dy = endPixel.y - startPixel.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        line.style.left = `${startPixel.x}px`;
        line.style.top = `${startPixel.y}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        return line;
    }

    /**
     * Limpa a rota de um drone específico
     * @param {Drone} drone - Drone cuja rota será limpa
     */
    clearDroneRoute(drone) {
        const routeLines = this.mapElement.querySelectorAll(`[data-drone-id="${drone.id}"]`);
        routeLines.forEach(line => line.remove());
    }

    /**
     * Remove um elemento do mapa
     * @param {string} elementKey - Chave do elemento
     */
    removeElement(elementKey) {
        const element = this.elements.get(elementKey);
        if (element) {
            element.remove();
            this.elements.delete(elementKey);
        }
    }

    /**
     * Atualiza todo o mapa com dados atuais
     */
    updateMap() {
        // Limpa elementos dinâmicos (mantém a base)
        this.clearDynamicElements();
        
        // Adiciona apenas pedidos pendentes e atribuídos (não entregues)
        if (window.orderController) {
            const allOrders = window.orderController.getAllOrders();
            allOrders.forEach(order => {
                if (order.status === 'pending' || order.status === 'assigned') {
                    this.addOrderElement(order);
                }
            });
        }
        
        // Adiciona drones
        if (window.droneController) {
            const allDrones = window.droneController.getAllDrones();
            allDrones.forEach(drone => {
                this.addDroneElement(drone);
                if (drone.currentRoute && drone.currentRoute.length > 1) {
                    this.drawDroneRoute(drone);
                }
            });
        }
    }

    /**
     * Limpa elementos dinâmicos (pedidos e drones, mantém base)
     */
    clearDynamicElements() {
        // Remove todos os elementos exceto a base
        for (const [key, element] of this.elements) {
            if (key !== 'base') {
                element.remove();
            }
        }
        
        // Mantém apenas a base no Map
        const baseElement = this.elements.get('base');
        this.elements.clear();
        if (baseElement) {
            this.elements.set('base', baseElement);
        }
        
        // Remove linhas de rota
        const routeLines = this.mapElement.querySelectorAll('.route-line');
        routeLines.forEach(line => line.remove());
    }

    /**
     * Mostra detalhes de um pedido
     * @param {Order} order - Pedido selecionado
     */
    showOrderDetails(order) {
        const details = `
Pedido: ${order.id}
Localização: (${order.location.x}, ${order.location.y})
Peso: ${order.weight}kg
Prioridade: ${order.priority}
Status: ${order.status}
Tempo de espera: ${order.getWaitingTime()} minutos
${order.assignedDrone ? `Drone atribuído: ${order.assignedDrone}` : ''}
        `;
        
        alert(details.trim());
    }

    /**
     * Mostra detalhes de um drone
     * @param {Drone} drone - Drone selecionado
     */
    showDroneDetails(drone) {
        const details = `
Drone: ${drone.id}
Status: ${drone.status}
Posição: (${drone.position.x.toFixed(1)}, ${drone.position.y.toFixed(1)})
Bateria: ${Math.round(drone.battery)}%
Carga atual: ${drone.currentLoad.toFixed(1)}kg / ${drone.capacity}kg
Pedidos atribuídos: ${drone.assignedOrders.length}
Entregas realizadas: ${drone.deliveriesCount}
Distância total: ${drone.totalDistance.toFixed(1)}km
        `;
        
        alert(details.trim());
    }

    /**
     * Adiciona grade de coordenadas ao mapa
     */
    addCoordinateGrid() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'coordinate-grid';
        gridContainer.style.position = 'absolute';
        gridContainer.style.top = '0';
        gridContainer.style.left = '0';
        gridContainer.style.width = '100%';
        gridContainer.style.height = '100%';
        gridContainer.style.pointerEvents = 'none';
        gridContainer.style.zIndex = '1';

        // Adiciona linhas verticais
        for (let x = 0; x <= 20; x += 5) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = `${(x / 20) * 100}%`;
            line.style.top = '0';
            line.style.width = '1px';
            line.style.height = '100%';
            line.style.backgroundColor = 'rgba(0,0,0,0.1)';
            gridContainer.appendChild(line);

            // Label
            const label = document.createElement('span');
            label.textContent = x;
            label.style.position = 'absolute';
            label.style.left = `${(x / 20) * 100}%`;
            label.style.bottom = '-20px';
            label.style.fontSize = '10px';
            label.style.transform = 'translateX(-50%)';
            gridContainer.appendChild(label);
        }

        // Adiciona linhas horizontais
        for (let y = 0; y <= 20; y += 5) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.top = `${(y / 20) * 100}%`;
            line.style.left = '0';
            line.style.width = '100%';
            line.style.height = '1px';
            line.style.backgroundColor = 'rgba(0,0,0,0.1)';
            gridContainer.appendChild(line);

            // Label
            const label = document.createElement('span');
            label.textContent = y;
            label.style.position = 'absolute';
            label.style.top = `${(y / 20) * 100}%`;
            label.style.left = '-25px';
            label.style.fontSize = '10px';
            label.style.transform = 'translateY(-50%)';
            gridContainer.appendChild(label);
        }

        this.mapElement.appendChild(gridContainer);
    }

    /**
     * Adiciona evento de clique no mapa para adicionar pedidos
     */
    enableOrderPlacement() {
        this.mapElement.addEventListener('click', (event) => {
            if (event.target === this.mapElement) {
                const rect = this.mapElement.getBoundingClientRect();
                const x = Math.round(((event.clientX - rect.left) / rect.width) * 20);
                const y = Math.round(((event.clientY - rect.top) / rect.height) * 20);
                
                const weight = prompt('Peso do pacote (kg):', '1.0');
                const priority = prompt('Prioridade (alta/media/baixa):', 'media');
                
                if (weight && priority && ['alta', 'media', 'baixa'].includes(priority)) {
                    const orderData = {
                        x: Math.max(0, Math.min(20, x)),
                        y: Math.max(0, Math.min(20, y)),
                        weight: parseFloat(weight),
                        priority: priority
                    };
                    
                    if (window.orderController) {
                        const result = window.orderController.addOrder(orderData);
                        if (!result.success) {
                            alert('Erro ao adicionar pedido: ' + result.message);
                        }
                    }
                }
            }
        });
    }

    /**
     * Redimensiona o mapa quando a janela é redimensionada
     */
    resize() {
        this.initializeMap();
        this.updateMap();
    }

    /**
     * Exporta o mapa como imagem (simulação)
     * @returns {string} - URL da imagem do mapa
     */
    exportAsImage() {
        // Esta é uma implementação simulada
        // Em um ambiente real, usaríamos canvas ou SVG
        console.log('Exportar mapa como imagem - funcionalidade simulada');
        return 'data:image/png;base64,simulated_map_image';
    }

    /**
     * Aplica zoom no mapa
     * @param {number} factor - Fator de zoom (1 = normal, >1 = zoom in, <1 = zoom out)
     */
    setZoom(factor) {
        this.mapElement.style.transform = `scale(${factor})`;
        this.mapElement.style.transformOrigin = 'center center';
    }

    /**
     * Centraliza o mapa em uma posição específica
     * @param {Object} position - Posição para centralizar {x, y}
     */
    centerOn(position) {
        const elementX = (position.x / 20) * this.mapElement.clientWidth;
        const elementY = (position.y / 20) * this.mapElement.clientHeight;
        
        this.mapElement.scrollTo({
            left: elementX - this.mapElement.clientWidth / 2,
            top: elementY - this.mapElement.clientHeight / 2,
            behavior: 'smooth'
        });
    }

    /**
     * Adiciona animação de pulso a um elemento
     * @param {string} elementKey - Chave do elemento
     */
    pulseElement(elementKey) {
        const element = this.elements.get(elementKey);
        if (element) {
            element.style.animation = 'pulse 1s infinite';
            setTimeout(() => {
                element.style.animation = '';
            }, 3000);
        }
    }

    /**
     * Destaca rotas de drones ativos
     */
    highlightActiveRoutes() {
        const routeLines = this.mapElement.querySelectorAll('.route-line');
        routeLines.forEach(line => {
            line.style.backgroundColor = '#ff6b35';
            line.style.boxShadow = '0 0 5px rgba(255, 107, 53, 0.5)';
        });
    }
}