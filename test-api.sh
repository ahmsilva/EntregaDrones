#!/bin/bash

# Script de teste da API do Sistema de Entrega por Drones
# Execute: chmod +x test-api.sh && ./test-api.sh

API_BASE="http://localhost:3000/api/v1"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚁 Testando API do Sistema de Entrega por Drones${NC}\n"

# Função para fazer requisições e mostrar resultado
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}📡 ${description}${NC}"
    echo -e "${BOLD}${method} ${API_BASE}${endpoint}${NC}"
    
    if [ -n "$data" ]; then
        echo -e "Data: ${data}"
        response=$(curl -s -X $method "${API_BASE}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X $method "${API_BASE}${endpoint}")
    fi
    
    # Verifica se a resposta contém "success": true
    if echo "$response" | grep -q '"success":\s*true'; then
        echo -e "${GREEN}✅ Sucesso${NC}"
    else
        echo -e "${RED}❌ Falha${NC}"
    fi
    
    # Mostra a resposta formatada (primeiros 200 caracteres)
    echo "$response" | head -c 200
    echo -e "\n---\n"
}

# 1. Health Check
make_request "GET" "/../../health" "" "Health Check do Servidor"

# 2. Reset do Sistema
make_request "POST" "/system/reset" "" "Reset do Sistema"

# 3. Popular com dados de exemplo
make_request "POST" "/system/seed" '{"drones": 3, "orders": 8}' "Popular Sistema com Dados de Exemplo"

# 4. Verificar status dos drones
make_request "GET" "/drones/status" "" "Status dos Drones"

# 5. Listar pedidos
make_request "GET" "/pedidos" "" "Listar Todos os Pedidos"

# 6. Criar um novo pedido
make_request "POST" "/pedidos" '{
    "clientLocation": {"x": 5, "y": 5},
    "weight": 2.5,
    "priority": "alta",
    "customerInfo": {
        "name": "Teste API",
        "phone": "(11) 99999-9999"
    }
}' "Criar Novo Pedido"

# 7. Criar um drone
make_request "POST" "/drones" '{
    "capacity": 8,
    "range": 12
}' "Criar Novo Drone"

# 8. Otimizar entregas
make_request "POST" "/entregas/otimizar" '{
    "strategy": "balanced_optimization",
    "maxDistance": 15
}' "Otimizar Entregas"

# 9. Ver rotas otimizadas
make_request "GET" "/entregas/rota" "" "Ver Rotas Otimizadas"

# 10. Iniciar simulação
make_request "POST" "/entregas/simular" '{
    "speed": 0.5,
    "realTime": false
}' "Iniciar Simulação"

# 11. Status das entregas
make_request "GET" "/entregas/status" "" "Status das Entregas"

# 12. Estatísticas do sistema
make_request "GET" "/system/stats" "" "Estatísticas do Sistema"

# 13. Configurações
make_request "GET" "/system/config" "" "Configurações do Sistema"

# 14. Filtrar pedidos por status
make_request "GET" "/pedidos?status=pending&limit=5" "" "Filtrar Pedidos Pendentes"

# 15. Criar múltiplos drones
make_request "POST" "/drones/batch" '{
    "count": 2,
    "capacity": 6,
    "range": 10
}' "Criar Múltiplos Drones"

echo -e "${BOLD}🎉 Teste da API Concluído!${NC}"
echo -e "${BLUE}Para mais detalhes, consulte README_API.md${NC}"