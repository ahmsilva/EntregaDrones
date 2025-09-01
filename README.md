# Sistema de Entrega por Drones - DTI Digital

Um sistema completo de gerenciamento de entregas por drones com interface web interativa e APIs RESTful.

## Características

- **Interface Web Interativa** - Visualização em tempo real com mapa 2D
- **APIs RESTful Completas** - Endpoints para todas as operações
- **Otimização Inteligente** - Algoritmos de roteamento e atribuição
- **Dashboard de Monitoramento** - Estatísticas e métricas em tempo real
- **Simulação Realística** - Sistema de bateria, movimentação e entregas
- **Design Responsivo** - Interface adaptável a diferentes dispositivos

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 16+ 
- npm 8+

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd EntregaDrones

# Instale as dependências
npm install

# Copie as configurações de exemplo
cp .env.example .env

# Execute o servidor
npm start
```

### Acesso

- **Interface Web**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📋 Funcionalidades

### Interface Web
- ✅ Visualização de mapa 2D interativo
- ✅ Criação e gerenciamento de drones
- ✅ Adição de pedidos com diferentes prioridades
- ✅ Otimização automática de rotas
- ✅ Simulação em tempo real das entregas
- ✅ Dashboard com estatísticas
- ✅ Sistema de notificações

### APIs REST
- ✅ **Drones**: CRUD completo + status
- ✅ **Pedidos**: Criação, listagem, filtros
- ✅ **Entregas**: Otimização, rotas, simulação
- ✅ **Sistema**: Configurações, estatísticas, reset

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + **Express.js** - Servidor e APIs


### Frontend
- **HTML5** + **CSS3** - Interface moderna
- **JavaScript ES6+** - Lógica interativa
- **Canvas API** - Visualização do mapa
- **Fetch API** - Comunicação com backend

### Arquitetura
- **MVC Pattern** - Separação de responsabilidades
- **RESTful APIs** - Padrões REST
- **Middleware Pattern** - Processamento de requisições
- **Observer Pattern** - Atualizações em tempo real

## 🧠 Uso de IA no Desenvolvimento

### Prompts Utilizados
1. **Arquitetura Inicial**:
   ```
   "Crie uma arquitetura MVC para sistema de entregas por drone com JavaScript, 
   priorizando performance e manutenibilidade"
   ```

2. **Algoritmo de Otimização**:
   ```
   "Desenvolva algoritmo para otimizar carregamento de drones 
   considerando peso, volume e prioridade"
   ```

3. **Interface de Usuário**:
   ```
   "Crie interface moderna e intuitiva para dashboard de monitoramento de drones 
   com design responsivo e acessível"
   ```

### Ferramentas de IA Utilizadas
- **ChatGPT/Claude**: Arquitetura e algoritmos
- **GitHub Copilot**: Autocompletar código
- **Tabnine**: Sugestões de código
## Algoritmos Implementados

### Otimização de Rotas
- **Nearest Neighbor** - Algoritmo de vizinho mais próximo
- **Capacity First** - Prioriza capacidade dos drones
- **Priority Queue** - Fila de prioridades para pedidos

### Estratégias de Atribuição
- `priority_first` - Prioriza pedidos urgentes
- `capacity_optimization` - Maximiza uso da capacidade
- `distance_optimization` - Minimiza distância total
- `balanced_optimization` - Abordagem equilibrada

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Data Layer    │
│                 │    │                 │    │                 │
│ - Interface Web │◄──►│ - Express APIs  │◄──►│ - In-Memory     │
│ - Canvas Map    │    │ - Controllers   │    │ - JSON Storage  │
│ - Real-time UI  │    │ - Middlewares   │    │ - State Mgmt    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estrutura de Diretórios

```
EntregaDrones/
├── 📄 server.js              # Servidor principal
├── 📄 package.json           # Dependências
├── 📄 README.md             # Esta documentação
├── 📄 README_API.md         # Documentação da API
├── 📁 src/
│   ├── 📁 routes/           # Rotas da API
│   │   ├── 📄 drones.js      # Endpoints de drones
│   │   ├── 📄 pedidos.js     # Endpoints de pedidos
│   │   ├── 📄 entregas.js    # Endpoints de entregas
│   │   └── 📄 system.js      # Endpoints do sistema
│   └── 📁 middleware/       # Middlewares
│       ├── 📄 errorHandler.js
│       └── 📄 validateRequest.js
├── 📁 js/                   # Frontend JavaScript
│   ├── 📁 models/          # Modelos de dados
│   ├── 📁 controllers/     # Controllers
│   ├── 📁 views/          # Views
│   └── 📄 main.js         # Inicialização
├── 📁 css/                 # Estilos
└── 📄 index.html          # Interface principal
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm start        # Inicia servidor em produção
npm run dev      # Inicia com nodemon (auto-reload)

# Utilitários
npm test         # Executa testes (a implementar)
npm run lint     # Verifica código (a implementar)
```

## 📡 Exemplos de API

### Fluxo Básico

```bash
# 1. Criar drones
curl -X POST http://localhost:3000/api/v1/drones/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 3, "capacity": 5, "range": 10}'

# 2. Criar pedidos
curl -X POST http://localhost:3000/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clientLocation": {"x": 15, "y": 8},
    "weight": 2.5,
    "priority": "alta"
  }'

# 3. Otimizar entregas
curl -X POST http://localhost:3000/api/v1/entregas/otimizar

# 4. Iniciar simulação
curl -X POST http://localhost:3000/api/v1/entregas/simular
```

### Monitoramento

```bash
# Status dos drones
curl http://localhost:3000/api/v1/drones/status

# Estatísticas do sistema
curl http://localhost:3000/api/v1/system/stats

# Status das entregas
curl http://localhost:3000/api/v1/entregas/status
```


## 🧪 Testes

### Manuais
- Interface web completamente testada
- Todos os endpoints da API validados
- Cenários de erro tratados

### Automatizados (Planejados)
- Unit tests com Jest
- Integration tests
- API tests com Supertest
- Load tests

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm install
npm start
```

### Produção
```bash
# Definir variáveis de ambiente
export NODE_ENV=production
export PORT=3000

# Executar
npm start
```

### Docker (Planejado)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📧 Contato

- **Desenvolvedor**: André Henrique Martins da Silva
- **Email**: [andre.henri2004@gmail.com]
- **LinkedIn**: [https://www.linkedin.com/in/andrehenri-ti]

---

### 🎯 Próximas Funcionalidades

- [ ] WebSockets para updates em tempo real
- [ ] Persistência em banco de dados
- [ ] Sistema de autenticação
- [ ] Interface mobile
- [ ] Integração com mapas reais
- [ ] Machine Learning para otimização
- [ ] Dashboard administrativo
- [ ] Relatórios exportáveis

**Desenvolvido com ❤️ para DTI Digital**
