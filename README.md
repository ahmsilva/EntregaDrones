# Sistema de Entrega por Drones - DTI Digital

Um sistema completo de simulação e otimização de entregas urbanas por drones, desenvolvido como parte do processo seletivo da DTI Digital.

## Objetivo Principal

**Alocar pacotes nos drones com o menor número de viagens possível, respeitando as regras de capacidade, distância e prioridade de entrega.**

## Funcionalidades Principais

### ✅ Funcionalidades Obrigatórias Implementadas

- **Simulação Completa**: Sistema MVC funcional com drones, pedidos e entregas
- **Algoritmos de Otimização**: Minimização inteligente do número de viagens
- **Regras de Negócio**: Capacidade, alcance e prioridade totalmente implementados
- **Interface Visual**: Mapa interativo 2D com visualização em tempo real
- **Testes**: Cobertura de funcionalidades principais
- **README Completo**: Instruções detalhadas de execução

### 🚀 Funcionalidades Avançadas Implementadas

- **Simulação de Bateria**: Drones consomem bateria por distância percorrida
- **Fila de Prioridade**: Sistema inteligente de ordenação por prioridade + tempo
- **Cálculo de Tempo**: Estimativa e tracking de tempo real de entrega
- **Dashboard Interativo**: Relatórios e estatísticas em tempo real
- **Algoritmos Múltiplos**: Diferentes estratégias de otimização
- **Feedback Visual**: Animações e indicadores de status

### 🎯 Diferenciais Técnicos

- **Otimização Inteligente**: Combina prioridade, peso, distância e tempo de espera
- **Simulação com Estados**: Drones transitam entre idle → loading → flying → delivering → returning
- **API RESTful Simulada**: Estrutura preparada para expansão backend
- **Algoritmos Avançados**: K-means clustering, nearest neighbor, 2-opt optimization
- **Tratamento de Erros**: Validações robustas e mensagens claras
- **Interface Responsiva**: Adaptável a diferentes tamanhos de tela

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Arquitetura**: MVC (Model-View-Controller)
- **Visualização**: Canvas 2D customizado para mapa interativo
- **Algoritmos**: Otimização heurística e meta-heurística

## Como Executar

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, mas recomendado)

### Execução Simples
1. Clone ou baixe o projeto
2. Abra o arquivo `index.html` em um navegador
3. O sistema será carregado automaticamente

### Execução com Servidor Local (Recomendado)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# Live Server (VSCode)
# Use a extensão Live Server
```

Acesse: `http://localhost:8000`

## Estrutura do Projeto

```
drone-delivery-system/
│
├── index.html              # Página principal
├── README.md              # Este arquivo
│
├── css/
│   └── style.css          # Estilos visuais
│
└── js/
    ├── models/
    │   ├── Drone.js       # Modelo do Drone
    │   └── Order.js       # Modelo do Pedido
    │
    ├── controllers/
    │   ├── DroneController.js    # Controlador de Drones
    │   ├── OrderController.js    # Controlador de Pedidos
    │   └── DeliveryController.js # Controlador Principal
    │
    ├── views/
    │   ├── MapView.js       # Visualização do Mapa
    │   └── UIView.js        # Interface do Usuário
    │
    ├── utils/
    │   └── OptimizationAlgorithm.js # Algoritmos de Otimização
    │
    └── main.js              # Arquivo principal
```

## Como Usar

### 1. Configuração Inicial
- Configure a capacidade dos drones (kg)
- Defina o alcance máximo (km)
- Escolha o número de drones
- Clique em "Inicializar Drones"

### 2. Adicionando Pedidos
- Insira as coordenadas (X, Y) do cliente
- Defina o peso do pacote
- Selecione a prioridade (alta, média, baixa)
- Clique em "Adicionar Pedido"

### 3. Otimização e Simulação
- Clique em "Otimizar Entregas" para atribuir pedidos aos drones
- Clique em "Iniciar Simulação" para ver os drones em ação
- Acompanhe o progresso no mapa e nos painéis de status

### 4. Funcionalidades Extras
- **Demo Completa**: Botão para demonstração automática
- **Pedidos de Exemplo**: Gera pedidos para teste rápido
- **Exportar/Importar**: Salva e carrega configurações
- **Relatórios**: Estatísticas detalhadas do sistema

## Algoritmos de Otimização

### 1. **Priority First**
- Prioriza pedidos de alta prioridade
- Considera tempo de espera
- Ideal para cenários com muitos pedidos urgentes

### 2. **Capacity Optimization**
- Maximiza uso da capacidade dos drones
- Minimiza número de viagens
- Melhor para alto volume de pedidos

### 3. **Distance Optimization**
- Agrupa pedidos por proximidade (K-means)
- Otimiza rotas usando nearest neighbor
- Ideal para entregas espalhadas geograficamente

### 4. **Balanced Optimization**
- Combina todos os fatores
- Algoritmo padrão balanceado
- Melhor performance geral na maioria dos casos

## Regras de Negócio Implementadas

### Capacidade
- Cada drone tem capacidade máxima em kg
- Sistema verifica peso antes de atribuir pedidos
- Impede sobrecarga dos drones

### Alcance
- Drones têm alcance máximo por carga
- Calcula distância total da rota (origem → entregas → base)
- Rejeita rotas que excedem o alcance

### Prioridade
- **Alta**: Processada primeiro, tempo limite 15min
- **Média**: Processada em seguida, tempo limite 30min
- **Baixa**: Processada por último, tempo limite 60min

### Bateria
- Simula consumo por distância (5% por km)
- Drones retornam à base com bateria baixa (<20%)
- Recarga automática na base

## Testes e Validação

### Casos de Teste Implementados
1. **Teste de Capacidade**: Impede sobrecarga dos drones
2. **Teste de Alcance**: Rejeita rotas muito longas
3. **Teste de Prioridade**: Ordena corretamente os pedidos
4. **Teste de Otimização**: Verifica redução do número de viagens
5. **Teste de Bateria**: Simula consumo e recarga

### Como Testar
1. Execute a "Demo Completa" para teste automático
2. Use "Pedidos de Exemplo" para cenários pré-definidos
3. Adicione pedidos manualmente para testes específicos
4. Monitore logs do console para debugging

## Atalhos de Teclado

- **Ctrl+O**: Otimizar entregas
- **Ctrl+S**: Iniciar/Parar simulação
- **Ctrl+Shift+R**: Resetar sistema
- **Esc**: Parar simulação

## Métricas e Relatórios

### Estatísticas Principais
- Total de pedidos processados
- Entregas completadas
- Número total de viagens
- Eficiência do sistema (%)
- Tempo médio de entrega

### Indicadores de Performance
- Utilização da capacidade dos drones
- Distância total percorrida
- Status da bateria em tempo real
- Pedidos atrasados por prioridade

## Arquitetura Técnica

### Padrão MVC
- **Models**: Drone, Order - Lógica de negócio
- **Views**: MapView, UIView - Interface e visualização
- **Controllers**: DroneController, OrderController, DeliveryController - Coordenação

### Algoritmos Utilizados
- **Otimização Heurística**: Greedy algorithms
- **Clustering**: K-means para agrupamento geográfico
- **Roteamento**: Nearest neighbor + 2-opt
- **Scheduling**: Priority queue com múltiplos critérios

## Considerações de Produção

### Escalabilidade
- Arquitetura modular permite expansão
- Algoritmos otimizados para performance
- Interface responsiva para diferentes dispositivos

### Manutenibilidade
- Código bem documentado
- Separação clara de responsabilidades
- Padrões de design consistentes

### Segurança
- Validação de inputs
- Tratamento de erros robusto
- Prevenção de operações inválidas

## Limitações Conhecidas

1. **Simulação 2D**: Não considera obstáculos 3D reais
2. **Clima**: Não simula condições meteorológicas
3. **Tráfego Aéreo**: Não considera regulamentações reais
4. **Persistência**: Dados não são salvos entre sessões (apenas export/import manual)

## Roadmap Futuro

### Melhorias Técnicas
- [ ] Integração com APIs reais de mapas
- [ ] Simulação 3D com obstáculos
- [ ] Machine Learning para otimização preditiva
- [ ] Backend real com banco de dados

### Funcionalidades Adicionais
- [ ] Múltiplas bases de operação
- [ ] Diferentes tipos de drones
- [ ] Integração com sistemas de pagamento
- [ ] Notificações push para clientes

## Contato e Suporte

Este projeto foi desenvolvido como parte do processo seletivo da DTI Digital.

**Tecnologias**: JavaScript, HTML5, CSS3  
**Paradigma**: Programação Orientada a Objetos  
**Arquitetura**: MVC  
**Foco**: Algoritmos de otimização e UX

---

**DTI Digital - Unlocking digital value. Together.**