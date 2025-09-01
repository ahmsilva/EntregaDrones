# API do Sistema de Entrega por Drones

Este documento descreve como usar as APIs RESTful do sistema de entrega por drones.

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar em produção
npm start
```

## Endpoints Principais

### Drones

#### `GET /api/v1/drones/status`
Retorna o status de todos os drones

**Resposta:**
```json
{
  "success": true,
  "data": {
    "drones": [
      {
        "id": "DRONE-1",
        "status": "idle",
        "battery": 100,
        "currentLoad": 0,
        "capacity": 5,
        "position": {"x": 10, "y": 10}
      }
    ],
    "summary": {
      "totalDrones": 3,
      "activeDrones": 0,
      "idleDrones": 3
    }
  }
}
```

#### `POST /api/v1/drones`
Cria um novo drone

**Requisição:**
```json
{
  "capacity": 5,
  "range": 10
}
```

#### `POST /api/v1/drones/batch`
Cria múltiplos drones

**Requisição:**
```json
{
  "count": 3,
  "capacity": 5,
  "range": 10
}
```

### Pedidos

#### `POST /api/v1/pedidos`
Cria um novo pedido

**Requisição:**
```json
{
  "clientLocation": {"x": 15, "y": 8},
  "weight": 2.5,
  "priority": "alta",
  "customerInfo": {
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  }
}
```

#### `GET /api/v1/pedidos`
Lista pedidos com filtros

**Query Parameters:**
- `status` - Filtra por status (pending, assigned, delivered)
- `priority` - Filtra por prioridade (alta, media, baixa)
- `limit` - Limite de resultados (padrão: 50)
- `offset` - Offset para paginação (padrão: 0)

### Entregas

#### `GET /api/v1/entregas/rota`
Retorna rotas otimizadas para todos os drones

#### `GET /api/v1/entregas/rota/:droneId`
Retorna rota específica de um drone

#### `POST /api/v1/entregas/otimizar`
Otimiza atribuição de pedidos aos drones

**Requisição:**
```json
{
  "strategy": "balanced_optimization",
  "maxDistance": 15
}
```

**Estratégias disponíveis:**
- `priority_first` - Prioriza pedidos de alta prioridade
- `capacity_optimization` - Maximiza uso da capacidade
- `distance_optimization` - Minimiza distância total
- `balanced_optimization` - Abordagem balanceada (padrão)

#### `POST /api/v1/entregas/simular`
Inicia simulação das entregas

**Requisição:**
```json
{
  "speed": 0.5,
  "realTime": false
}
```

#### `GET /api/v1/entregas/status`
Status atual das entregas

### Sistema

#### `POST /api/v1/system/reset`
Reseta todo o sistema

#### `GET /api/v1/system/stats`
Estatísticas completas do sistema

#### `GET /api/v1/system/config`
Configurações do sistema

#### `POST /api/v1/system/seed`
Popula sistema com dados de exemplo

**Requisição:**
```json
{
  "drones": 3,
  "orders": 8
}
```

## Exemplos de Uso

### Fluxo Completo via API

```bash
# 1. Popular sistema com dados de exemplo
curl -X POST http://localhost:3000/api/v1/system/seed \
  -H "Content-Type: application/json" \
  -d '{"drones": 3, "orders": 8}'

# 2. Verificar status dos drones
curl http://localhost:3000/api/v1/drones/status

# 3. Listar pedidos pendentes
curl http://localhost:3000/api/v1/pedidos?status=pending

# 4. Otimizar entregas
curl -X POST http://localhost:3000/api/v1/entregas/otimizar \
  -H "Content-Type: application/json" \
  -d '{"strategy": "balanced_optimization"}'

# 5. Verificar rotas
curl http://localhost:3000/api/v1/entregas/rota

# 6. Iniciar simulação
curl -X POST http://localhost:3000/api/v1/entregas/simular \
  -H "Content-Type: application/json" \
  -d '{"speed": 0.5}'

# 7. Monitorar status das entregas
curl http://localhost:3000/api/v1/entregas/status
```

### Criando Pedidos Individuais

```bash
# Pedido de alta prioridade
curl -X POST http://localhost:3000/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clientLocation": {"x": 5, "y": 5},
    "weight": 2.5,
    "priority": "alta",
    "customerInfo": {
      "name": "Maria Silva",
      "phone": "(11) 98888-8888",
      "email": "maria@example.com"
    }
  }'

# Pedido de média prioridade
curl -X POST http://localhost:3000/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clientLocation": {"x": 15, "y": 12},
    "weight": 1.8,
    "priority": "media"
  }'
```

### Gerenciando Drones

```bash
# Criar drone individual
curl -X POST http://localhost:3000/api/v1/drones \
  -H "Content-Type: application/json" \
  -d '{"capacity": 8, "range": 15}'

# Criar múltiplos drones
curl -X POST http://localhost:3000/api/v1/drones/batch \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "capacity": 5, "range": 10}'

# Obter informações de um drone específico
curl http://localhost:3000/api/v1/drones/DRONE-1

# Atualizar drone
curl -X PUT http://localhost:3000/api/v1/drones/DRONE-1 \
  -H "Content-Type: application/json" \
  -d '{"capacity": 10, "battery": 85}'
```

### Monitoramento e Estatísticas

```bash
# Health check
curl http://localhost:3000/health

# Estatísticas completas do sistema
curl http://localhost:3000/api/v1/system/stats

# Configurações atuais
curl http://localhost:3000/api/v1/system/config

# Status detalhado das entregas
curl http://localhost:3000/api/v1/entregas/status
```

## Códigos de Resposta HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `404` - Recurso não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

## Estrutura de Resposta Padrão

Todas as respostas seguem o formato:

```json
{
  "success": true|false,
  "data": {...},
  "message": "Mensagem opcional",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Em caso de erro:

```json
{
  "success": false,
  "error": "Tipo do erro",
  "message": "Descrição do erro",
  "details": [...] // Opcional, para erros de validação
}
```

## Rate Limiting

- **Geral**: 100 requisições por minuto por IP
- **Otimização**: 10 requisições por minuto por IP
- **Simulação**: 5 requisições por minuto por IP

## Validação de Dados

### Coordenadas
- `x` e `y` devem estar entre 0 e 20
- Representam posições no grid da cidade

### Drones
- `capacity`: 1-20 kg
- `range`: 1-50 km
- `battery`: 0-100%

### Pedidos
- `weight`: 0.1-20 kg
- `priority`: "alta", "media" ou "baixa"
- `status`: "pending", "assigned", "delivered"

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Joi** - Validação de dados
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logging de requisições
- **Compression** - Compressão de respostas

## Desenvolvimento

### Estrutura do Projeto

```
EntregaDrones/
├── server.js              # Servidor principal
├── package.json           # Dependências e scripts
├── .env.example          # Configurações de exemplo
├── src/
│   ├── routes/           # Rotas da API
│   │   ├── drones.js
│   │   ├── pedidos.js
│   │   ├── entregas.js
│   │   └── system.js
│   └── middleware/       # Middlewares
│       ├── errorHandler.js
│       └── validateRequest.js
├── js/                   # Frontend (JavaScript)
├── css/                  # Frontend (CSS)
└── index.html           # Interface web
```

### Scripts Disponíveis

```bash
npm start      # Produção
npm run dev    # Desenvolvimento com nodemon
npm test       # Testes (a implementar)
```

## Integração com Frontend

O sistema mantém compatibilidade com a interface web existente. A API pode ser usada tanto via:

1. **Interface Web** - Acesse `http://localhost:3000`
2. **API REST** - Use os endpoints `/api/v1/*`
3. **Ferramentas HTTP** - curl, Postman, etc.

## Próximos Passos

- [ ] Implementar WebSockets para atualizações em tempo real
- [ ] Adicionar autenticação e autorização
- [ ] Implementar persistência em banco de dados
- [ ] Adicionar testes automatizados
- [ ] Implementar cache Redis
- [ ] Adicionar métricas e observabilidade