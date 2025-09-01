/**
 * Servidor Express.js - Sistema de Entrega por Drones
 * APIs RESTful para gerenciamento de drones, pedidos e entregas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Importa rotas
const dronesRoutes = require('./src/routes/drones');
const pedidosRoutes = require('./src/routes/pedidos');
const entregasRoutes = require('./src/routes/entregas');
const systemRoutes = require('./src/routes/system');

// Importa middlewares
const errorHandler = require('./src/middleware/errorHandler');
const validateRequest = require('./src/middleware/validateRequest');

// Configurações
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Inicializa Express
const app = express();

// Middlewares de segurança e performance
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        },
    },
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: require('./package.json').version
    });
});

// API Routes
app.use('/api/v1/drones', dronesRoutes);
app.use('/api/v1/pedidos', pedidosRoutes);
app.use('/api/v1/entregas', entregasRoutes);
app.use('/api/v1/system', systemRoutes);

// Documentação da API
app.get('/api', (req, res) => {
    res.json({
        name: 'Sistema de Entrega por Drones API',
        version: '1.0.0',
        description: 'APIs RESTful para gerenciamento de entregas por drones',
        endpoints: {
            health: 'GET /health',
            drones: {
                status: 'GET /api/v1/drones/status',
                create: 'POST /api/v1/drones',
                list: 'GET /api/v1/drones',
                update: 'PUT /api/v1/drones/:id',
                delete: 'DELETE /api/v1/drones/:id'
            },
            pedidos: {
                create: 'POST /api/v1/pedidos',
                list: 'GET /api/v1/pedidos',
                get: 'GET /api/v1/pedidos/:id',
                update: 'PUT /api/v1/pedidos/:id',
                delete: 'DELETE /api/v1/pedidos/:id'
            },
            entregas: {
                rotas: 'GET /api/v1/entregas/rota',
                otimizar: 'POST /api/v1/entregas/otimizar',
                simular: 'POST /api/v1/entregas/simular',
                status: 'GET /api/v1/entregas/status'
            },
            system: {
                reset: 'POST /api/v1/system/reset',
                stats: 'GET /api/v1/system/stats',
                config: 'GET /api/v1/system/config'
            }
        },
        documentation: '/api/docs'
    });
});

// Rota para servir o frontend na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler para rotas da API
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        message: `Rota ${req.method} ${req.path} não existe`,
        availableEndpoints: '/api'
    });
});

// Error handler
app.use(errorHandler);

// Inicialização do servidor
let server;

const startServer = () => {
    server = app.listen(PORT, () => {
        console.log(`
🚁 ═══════════════════════════════════════════════════════════
   Sistema de Entrega por Drones - DTI Digital
   
   Servidor rodando em: http://localhost:${PORT}
   Ambiente: ${NODE_ENV}
   API Documentation: http://localhost:${PORT}/api
   Frontend: http://localhost:${PORT}
   
   Health Check: http://localhost:${PORT}/health
═══════════════════════════════════════════════════════════ 🚁
        `);
    });
};

const stopServer = () => {
    if (server) {
        server.close(() => {
            console.log('Servidor encerrado gracefully');
            process.exit(0);
        });
    }
};

// Graceful shutdown
process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Inicia o servidor apenas se não estiver sendo importado (para testes)
if (require.main === module) {
    startServer();
}

module.exports = app;