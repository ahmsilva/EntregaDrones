/**
 * UIView - Controlador da interface do usuário
 * Gerencia atualizações de status, listas e estatísticas
 */
class UIView {
    constructor() {
        this.updateInterval = null;
        this.isAutoUpdateEnabled = true;
    }

    /**
     * Inicializa a interface do usuário
     */
    initialize() {
        this.setupEventListeners();
        this.startAutoUpdate();
        console.log('Interface do usuário inicializada');
    }

    /**
     * Configura os eventos da interface
     */
    setupEventListeners() {
        // Formulário de pedidos
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOrderSubmission();
            });
        }

        // Adiciona função global para remover pedidos
        window.removeOrder = (orderId) => {
            if (confirm('Tem certeza que deseja remover este pedido?')) {
                if (window.orderController) {
                    window.orderController.removeOrder(orderId);
                }
            }
        };
    }

    /**
     * Manipula a submissão de novos pedidos
     */
    handleOrderSubmission() {
        const orderData = {
            x: parseFloat(document.getElementById('clientX').value),
            y: parseFloat(document.getElementById('clientY').value),
            weight: parseFloat(document.getElementById('packageWeight').value),
            priority: document.getElementById('priority').value
        };

        if (window.orderController) {
            const result = window.orderController.addOrder(orderData);
            
            if (result.success) {
                // Limpa o formulário
                document.getElementById('orderForm').reset();
                this.showNotification('Pedido adicionado com sucesso!', 'success');
            } else {
                this.showNotification('Erro: ' + result.message, 'error');
            }
        }
    }

    /**
     * Atualiza o status dos drones na interface
     */
    updateDroneStatus() {
        const container = document.getElementById('droneStatusContainer');
        if (!container || !window.droneController) return;

        container.innerHTML = '';
        const drones = window.droneController.getAllDrones();

        if (drones.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b;">Nenhum drone configurado</p>';
            return;
        }

        drones.forEach(drone => {
            const droneCard = this.createDroneCard(drone);
            container.appendChild(droneCard);
        });
    }

    /**
     * Cria um card de status do drone
     * @param {Drone} drone - Drone para criar o card
     * @returns {HTMLElement} - Elemento do card
     */
    createDroneCard(drone) {
        const card = document.createElement('div');
        card.className = 'drone-card';
        
        const statusClass = this.getStatusClass(drone.status);
        const batteryColor = this.getBatteryColor(drone.battery);
        
        card.innerHTML = `
            <h4>${drone.id}</h4>
            <div class="drone-status-indicator ${statusClass}">
                ${this.getStatusText(drone.status)}
            </div>
            <div class="drone-info">
                <div class="info-row">
                    <span>Bateria:</span>
                    <span style="color: ${batteryColor}">${Math.round(drone.battery)}%</span>
                </div>
                <div class="info-row">
                    <span>Carga:</span>
                    <span>${drone.currentLoad.toFixed(1)}kg/${drone.capacity}kg</span>
                </div>
                <div class="info-row">
                    <span>Posição:</span>
                    <span>(${drone.position.x.toFixed(1)}, ${drone.position.y.toFixed(1)})</span>
                </div>
                <div class="info-row">
                    <span>Pedidos:</span>
                    <span>${drone.assignedOrders.length}</span>
                </div>
                <div class="info-row">
                    <span>Entregas:</span>
                    <span>${drone.deliveriesCount}</span>
                </div>
            </div>
        `;

        // Adiciona estilo para as linhas de informação
        const infoRows = card.querySelectorAll('.info-row');
        infoRows.forEach(row => {
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
            `;
        });

        return card;
    }

    /**
     * Retorna a classe CSS para o status do drone
     * @param {string} status - Status do drone
     * @returns {string} - Classe CSS
     */
    getStatusClass(status) {
        const statusClasses = {
            'idle': 'status-idle',
            'loading': 'status-loading',
            'flying': 'status-flying',
            'delivering': 'status-delivering',
            'returning': 'status-flying'
        };
        return statusClasses[status] || 'status-idle';
    }

    /**
     * Retorna o texto descritivo do status
     * @param {string} status - Status do drone
     * @returns {string} - Texto do status
     */
    getStatusText(status) {
        const statusTexts = {
            'idle': 'Ocioso',
            'loading': 'Carregando',
            'flying': 'Voando',
            'delivering': 'Entregando',
            'returning': 'Retornando'
        };
        return statusTexts[status] || 'Desconhecido';
    }

    /**
     * Retorna a cor da bateria baseada no nível
     * @param {number} battery - Nível da bateria
     * @returns {string} - Cor CSS
     */
    getBatteryColor(battery) {
        if (battery > 60) return '#10b981';
        if (battery > 30) return '#f59e0b';
        return '#ef4444';
    }

    /**
     * Atualiza a lista de pedidos
     */
    updateOrdersList() {
        const container = document.getElementById('ordersList');
        if (!container || !window.orderController) return;

        container.innerHTML = '';
        const pendingOrders = window.orderController.getPendingOrders();

        if (pendingOrders.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b;">Nenhum pedido pendente</p>';
            return;
        }

        pendingOrders.forEach(order => {
            const orderElement = this.createOrderElement(order);
            container.appendChild(orderElement);
        });
    }

    /**
     * Cria um elemento de pedido para a lista
     * @param {Order} order - Pedido para criar o elemento
     * @returns {HTMLElement} - Elemento do pedido
     */
    createOrderElement(order) {
        const element = document.createElement('div');
        element.className = 'order-item';
        
        const priorityClass = `priority-${order.priority}`;
        const isOverdue = order.isOverdue();
        
        element.innerHTML = `
            <div class="order-info">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>${order.id}</strong>
                    <span class="order-priority ${priorityClass}">${order.priority}</span>
                    ${isOverdue ? '<span style="color: #ef4444; font-size: 12px;">⚠ Atrasado</span>' : ''}
                </div>
                <div style="font-size: 14px; color: #64748b;">
                    Localização: (${order.location.x}, ${order.location.y}) | 
                    Peso: ${order.weight}kg | 
                    Aguardando: ${order.getWaitingTime()}min
                </div>
            </div>
            <div class="order-actions">
                <button onclick="removeOrder('${order.id}')" class="btn-small btn-danger" style="padding: 5px 10px; font-size: 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Remover
                </button>
            </div>
        `;

        return element;
    }

    /**
     * Atualiza as estatísticas do sistema
     */
    updateStatistics() {
        if (!window.deliverySystem) return;

        const stats = window.deliverySystem.getSystemStatistics();
        
        // Atualiza contadores principais
        this.updateStatElement('totalOrders', stats.totalOrders);
        this.updateStatElement('completedDeliveries', stats.deliveredOrders);
        this.updateStatElement('totalTrips', stats.totalTrips);
        this.updateStatElement('efficiency', `${stats.efficiency}%`);
    }

    /**
     * Atualiza um elemento de estatística
     * @param {string} elementId - ID do elemento
     * @param {string|number} value - Valor a exibir
     */
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Mostra uma notificação para o usuário
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo ('success', 'error', 'warning', 'info')
     */
    showNotification(message, type = 'info') {
        // Remove notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;

        // Define cor baseada no tipo
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Inicia a atualização automática da interface
     */
    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            if (this.isAutoUpdateEnabled) {
                this.updateDroneStatus();
                this.updateStatistics();
            }
        }, 1000);
    }

    /**
     * Para a atualização automática
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Gera botões para pedidos de exemplo
     */
    addSampleOrdersButton() {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;

        const sampleSection = document.createElement('div');
        sampleSection.className = 'panel-section';
        sampleSection.innerHTML = `
            <h3>Pedidos de Exemplo</h3>
            <button onclick="uiView.generateSampleOrders()" class="btn btn-secondary">
                Gerar 5 Pedidos de Exemplo
            </button>
        `;

        controlPanel.appendChild(sampleSection);
    }

    /**
     * Gera pedidos de exemplo
     */
    generateSampleOrders() {
        if (window.orderController) {
            window.orderController.generateSampleOrders(5);
            this.showNotification('5 pedidos de exemplo adicionados!', 'success');
        }
    }

    /**
     * Mostra modal com relatório detalhado
     */
    showDetailedReport() {
        if (!window.deliverySystem) return;

        const report = window.deliverySystem.generateReport();
        const modal = this.createReportModal(report);
        document.body.appendChild(modal);
    }

    /**
     * Cria modal com relatório
     * @param {Object} report - Dados do relatório
     * @returns {HTMLElement} - Elemento do modal
     */
    createReportModal(report) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        `;

        content.innerHTML = `
            <h2 style="color: #1e3a8a; margin-bottom: 20px;">Relatório do Sistema</h2>
            
            <div style="margin-bottom: 20px;">
                <h3>Estatísticas Gerais</h3>
                <p>Total de Pedidos: ${report.statistics.totalOrders}</p>
                <p>Pedidos Entregues: ${report.statistics.deliveredOrders}</p>
                <p>Eficiência: ${report.statistics.efficiency}%</p>
                <p>Total de Viagens: ${report.statistics.totalTrips}</p>
                <p>Tempo Médio de Entrega: ${report.statistics.averageDeliveryTime} min</p>
            </div>

            <div style="margin-bottom: 20px;">
                <h3>Status dos Drones</h3>
                <p>Drones Ativos: ${report.statistics.activeDrones}</p>
                <p>Drones Ociosos: ${report.statistics.idleDrones}</p>
                <p>Score de Saúde: ${report.droneHealth.healthScore}%</p>
            </div>

            ${report.recommendations.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h3>Recomendações</h3>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <button onclick="this.parentNode.parentNode.remove()" style="background: #1e3a8a; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                Fechar
            </button>
        `;

        modal.appendChild(content);

        // Fecha modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    /**
     * Mostra uma notificação para o usuário
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo ('success', 'error', 'warning', 'info')
     */
    showNotification(message, type = 'info') {
        // Remove notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;

        // Define cor baseada no tipo
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Adiciona animações CSS necessárias
     */
    addAnimationStyles() {
        if (document.getElementById('animationStyles')) return;

        const style = document.createElement('style');
        style.id = 'animationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;

        document.head.appendChild(style);
    }
}