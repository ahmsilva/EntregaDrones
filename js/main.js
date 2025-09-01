/**
 * Main.js - Arquivo principal do sistema de entrega por drones
 * Inicializa todos os controladores e componentes do sistema
 */

// Variáveis globais para os controladores
let droneController;
let orderController;
let deliverySystem;
let mapView;
let uiView;

/**
 * Inicializa o sistema completo quando a página carrega
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Sistema de Entrega por Drones...');
    
    try {
        // Inicializa controladores
        initializeControllers();
        
        // Inicializa views
        initializeViews();
        
        // Configura sistema de entrega
        initializeDeliverySystem();
        
        // Adiciona eventos globais
        setupGlobalEvents();
        
        console.log('Sistema inicializado com sucesso!');
        
        // Mostra mensagem de boas-vindas
        setTimeout(() => {
            uiView.showNotification('Sistema de Drones DTI Digital carregado com sucesso!', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        alert('Erro ao inicializar o sistema. Verifique o console para mais detalhes.');
    }
});

/**
 * Inicializa todos os controladores do sistema
 */
function initializeControllers() {
    // Inicializa controladores principais
    droneController = new DroneController();
    orderController = new OrderController();
    deliverySystem = new DeliveryController();
    
    // Torna controladores acessíveis globalmente
    window.droneController = droneController;
    window.orderController = orderController;
    window.deliverySystem = deliverySystem;
    
    console.log('Controladores inicializados');
}

/**
 * Inicializa todas as views do sistema
 */
function initializeViews() {
    // Inicializa visualizações
    mapView = new MapView('cityMap');
    uiView = new UIView();
    
    // Torna views acessíveis globalmente
    window.mapView = mapView;
    window.uiView = uiView;
    
    // Inicializa componentes das views
    uiView.initialize();
    uiView.addAnimationStyles();
    
    console.log('Views inicializadas');
}

/**
 * Inicializa o sistema de entrega
 */
function initializeDeliverySystem() {
    deliverySystem.initialize();
    
    // Atualiza interface inicial
    uiView.updateDroneStatus();
    uiView.updateOrdersList();
    uiView.updateStatistics();
    mapView.updateMap();
    
    console.log('Sistema de entrega inicializado');
}

/**
 * Configura eventos globais e handlers
 */
function setupGlobalEvents() {
    // Configura event listeners dos botões
    setupEventListeners();
    
    // Redimensionamento da janela
    window.addEventListener('resize', function() {
        if (mapView) {
            mapView.resize();
        }
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(event) {
        handleKeyboardShortcuts(event);
    });
    
    // Previne fechamento acidental durante simulação
    window.addEventListener('beforeunload', function(event) {
        if (deliverySystem && deliverySystem.isSimulationRunning) {
            event.preventDefault();
            event.returnValue = 'Uma simulação está em andamento. Tem certeza que deseja sair?';
        }
    });
    
    console.log('Eventos globais configurados');
}

/**
 * Manipula atalhos de teclado
 * @param {KeyboardEvent} event - Evento do teclado
 */
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + O: Otimizar entregas
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        if (deliverySystem) {
            deliverySystem.optimizeDeliveries();
        }
    }
    
    // Ctrl/Cmd + S: Iniciar/parar simulação
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (deliverySystem) {
            if (deliverySystem.isSimulationRunning) {
                deliverySystem.stopSimulation();
            } else {
                deliverySystem.startSimulation();
            }
        }
    }
    
    // Ctrl/Cmd + R: Resetar sistema
    if ((event.ctrlKey || event.metaKey) && event.key === 'r' && event.shiftKey) {
        event.preventDefault();
        if (confirm('Tem certeza que deseja resetar todo o sistema?')) {
            if (deliverySystem) {
                deliverySystem.resetSystem();
            }
        }
    }
    
    // Esc: Parar simulação
    if (event.key === 'Escape') {
        if (deliverySystem && deliverySystem.isSimulationRunning) {
            deliverySystem.stopSimulation();
        }
    }
}

/**
 * Funções utilitárias globais para uso na interface
 */

/**
 * Gera pedidos de exemplo para demonstração
 */
function generateSampleData() {
    if (!orderController) {
        console.error('OrderController não disponível');
        return false;
    }
    
    const sampleOrders = [
        { x: 5, y: 5, weight: 2.5, priority: 'alta' },
        { x: 15, y: 8, weight: 1.2, priority: 'media' },
        { x: 3, y: 12, weight: 3.8, priority: 'baixa' },
        { x: 18, y: 6, weight: 1.5, priority: 'alta' },
        { x: 12, y: 15, weight: 4.2, priority: 'media' },
        { x: 7, y: 18, weight: 0.8, priority: 'baixa' },
        { x: 16, y: 3, weight: 2.1, priority: 'alta' },
        { x: 4, y: 16, weight: 3.5, priority: 'media' }
    ];
    
    let successCount = 0;
    sampleOrders.forEach(orderData => {
        const result = orderController.addOrder(orderData);
        if (result && result.success) {
            successCount++;
        } else {
            console.warn('Falha ao adicionar pedido:', orderData, result ? result.message : 'Erro desconhecido');
        }
    });
    
    console.log(`${successCount} de ${sampleOrders.length} pedidos de exemplo adicionados com sucesso`);
    
    if (uiView) {
        uiView.showNotification(`${successCount} pedidos de exemplo adicionados!`, 'success');
    }
    
    return successCount > 0;
}

/**
 * Exporta configuração do sistema
 */
function exportSystemConfiguration() {
    try {
        const config = {
            timestamp: new Date().toISOString(),
            drones: droneController ? droneController.exportConfiguration() : null,
            orders: orderController ? orderController.exportOrders() : null,
            systemStats: deliverySystem ? deliverySystem.getSystemStatistics() : null
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `drone-system-config-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (uiView) {
            uiView.showNotification('Configuração exportada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao exportar configuração:', error);
        if (uiView) {
            uiView.showNotification('Erro ao exportar configuração', 'error');
        }
    }
}

/**
 * Importa configuração do sistema
 */
function importSystemConfiguration() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const config = JSON.parse(e.target.result);
                
                if (config.drones && droneController) {
                    droneController.importConfiguration(config.drones);
                }
                
                if (config.orders && orderController) {
                    orderController.importOrders(config.orders);
                }
                
                // Atualiza interface
                if (uiView) {
                    uiView.updateDroneStatus();
                    uiView.updateOrdersList();
                    uiView.updateStatistics();
                    uiView.showNotification('Configuração importada com sucesso!', 'success');
                }
                
                if (mapView) {
                    mapView.updateMap();
                }
                
            } catch (error) {
                console.error('Erro ao importar configuração:', error);
                if (uiView) {
                    uiView.showNotification('Erro ao importar configuração', 'error');
                }
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Mostra ajuda do sistema
 */
function showSystemHelp() {
    const helpContent = `
        <h3>Sistema de Entrega por Drones - DTI Digital</h3>
        <h4>Atalhos de Teclado:</h4>
        <ul>
            <li><strong>Ctrl+O</strong>: Otimizar entregas</li>
            <li><strong>Ctrl+S</strong>: Iniciar/Parar simulação</li>
            <li><strong>Ctrl+Shift+R</strong>: Resetar sistema</li>
            <li><strong>Esc</strong>: Parar simulação</li>
        </ul>
        
        <h4>Como usar:</h4>
        <ol>
            <li><strong>Configure os Drones:</strong> Defina capacidade, alcance e quantidade</li>
            <li><strong>Adicione Pedidos:</strong> Insira coordenadas, peso e prioridade</li>
            <li><strong>Otimize:</strong> Clique em "Otimizar Entregas" para atribuir pedidos</li>
            <li><strong>Simule:</strong> Inicie a simulação para ver drones em ação</li>
        </ol>
        
        <h4>Funcionalidades:</h4>
        <ul>
            <li>Algoritmos inteligentes de otimização de rotas</li>
            <li>Simulação em tempo real com animações</li>
            <li>Sistema de prioridades (alta, média, baixa)</li>
            <li>Monitoramento de bateria e capacidade</li>
            <li>Relatórios e estatísticas detalhadas</li>
        </ul>
    `;
    
    if (uiView) {
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
        
        content.innerHTML = helpContent + `
            <button onclick="this.parentNode.parentNode.remove()" 
                    style="background: #1e3a8a; color: white; padding: 10px 20px; 
                           border: none; border-radius: 6px; cursor: pointer; width: 100%; 
                           margin-top: 20px;">
                Fechar
            </button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Fecha modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

/**
 * Configura eventos dos botões após carregamento da página
 */
function setupEventListeners() {
    // Botão Inicializar Drones
    const initDronesBtn = document.getElementById('initializeDrones');
    if (initDronesBtn) {
        initDronesBtn.addEventListener('click', function() {
            if (droneController) {
                droneController.initializeDrones();
            }
        });
    }

    // Botão Gerar Pedidos de Exemplo
    const sampleOrdersBtn = document.getElementById('addSampleOrders');
    if (sampleOrdersBtn) {
        sampleOrdersBtn.addEventListener('click', function() {
            generateSampleData();
        });
    }

    // Botão Otimizar Entregas
    const optimizeBtn = document.getElementById('optimizeDeliveries');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function() {
            if (deliverySystem) {
                deliverySystem.optimizeDeliveries();
            }
        });
    }

    // Botão Iniciar Simulação
    const startSimBtn = document.getElementById('startSimulation');
    if (startSimBtn) {
        startSimBtn.addEventListener('click', function() {
            if (deliverySystem) {
                deliverySystem.startSimulation();
            }
        });
    }

    // Botão Resetar Sistema
    const resetBtn = document.getElementById('resetSystem');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (deliverySystem) {
                deliverySystem.resetSystem();
            }
        });
    }

    // Botão Executar Demo Completa
    const demoBtn = document.getElementById('runDemo');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            runDemo();
        });
    }

    console.log('✓ Event listeners configurados');
}
function runDemo() {
    if (!droneController || !orderController || !deliverySystem) {
        alert('Sistema não inicializado corretamente');
        return;
    }
    
    console.log('Iniciando demonstração...');
    
    // Primeiro, limpa o sistema
    deliverySystem.resetSystem();
    
    // Passo 1: Configura drones
    document.getElementById('droneCapacity').value = '5';
    document.getElementById('droneRange').value = '15';
    document.getElementById('droneCount').value = '3';
    droneController.initializeDrones();
    
    if (uiView) {
        uiView.showNotification('Demo: Drones configurados', 'info');
    }
    
    // Passo 2: Adiciona pedidos de exemplo após 1 segundo
    setTimeout(() => {
        const sampleResult = generateSampleData();
        
        if (!sampleResult) {
            if (uiView) {
                uiView.showNotification('Demo: Falha ao adicionar pedidos', 'error');
            }
            return;
        }
        
        if (uiView) {
            uiView.showNotification('Demo: Pedidos adicionados', 'info');
        }
        
        // Aguarda atualização da interface antes de otimizar
        setTimeout(() => {
            // Verifica se realmente há pedidos pendentes
            const pendingOrders = orderController.getPendingOrders();
            console.log('Pedidos pendentes antes da otimização:', pendingOrders.length);
            
            if (pendingOrders.length === 0) {
                if (uiView) {
                    uiView.showNotification('Demo: Nenhum pedido pendente para otimizar', 'error');
                }
                return;
            }
            
            // Passo 3: Otimiza entregas
            const result = deliverySystem.optimizeDeliveries();
            console.log('Resultado da otimização:', result);
            
            if (uiView) {
                uiView.showNotification('Demo: ' + result.message, result.success ? 'success' : 'warning');
            }
            
            // Verifica se a otimização foi bem-sucedida antes de iniciar simulação
            if (result.success) {
                // Passo 4: Inicia simulação após 2 segundos
                setTimeout(() => {
                    const simulationResult = deliverySystem.startSimulation();
                    if (simulationResult !== false) {
                        if (uiView) {
                            uiView.showNotification('Demo: Simulação iniciada!', 'success');
                        }
                    } else {
                        if (uiView) {
                            uiView.showNotification('Demo: Erro ao iniciar simulação', 'error');
                        }
                    }
                }, 2000);
            } else {
                if (uiView) {
                    uiView.showNotification('Demo: Falha na otimização - simulação não iniciada', 'error');
                }
            }
            
        }, 1500);
        
    }, 1000);
}

/**
 * Adiciona botões extras de demonstração
 */
function addDemoButtons() {
    // Botões já estão no HTML, não precisa adicionar mais
    console.log('✓ Botões de demonstração já disponíveis no HTML');
}

// Adiciona botões de demo quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addDemoButtons();
    }, 500);
});

/**
 * Função de debug para desenvolvedores
 */
function debugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('Drones:', droneController ? droneController.getAllDrones() : 'não inicializado');
    console.log('Pedidos:', orderController ? orderController.getAllOrders() : 'não inicializado');
    console.log('Estatísticas:', deliverySystem ? deliverySystem.getSystemStatistics() : 'não inicializado');
    console.log('Simulação ativa:', deliverySystem ? deliverySystem.isSimulationRunning : 'desconhecido');
    console.log('==================');
}

// Torna função de debug acessível globalmente
window.debugInfo = debugInfo;

// Torna funções utilitárias acessíveis globalmente
window.generateSampleData = generateSampleData;
window.exportSystemConfiguration = exportSystemConfiguration;
window.importSystemConfiguration = importSystemConfiguration;
window.showSystemHelp = showSystemHelp;
window.runDemo = runDemo;

console.log('Main.js carregado - Sistema de Entrega por Drones DTI Digital v1.0');