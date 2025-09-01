/**
 * Middleware - Request Validation
 * Validação centralizada de requisições
 */

const Joi = require('joi');

/**
 * Middleware para validar requests
 * @param {Object} schema - Schema Joi para validação
 * @param {string} source - Fonte dos dados (body, params, query)
 */
const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        let dataToValidate;
        
        switch (source) {
            case 'body':
                dataToValidate = req.body;
                break;
            case 'params':
                dataToValidate = req.params;
                break;
            case 'query':
                dataToValidate = req.query;
                break;
            default:
                dataToValidate = req.body;
        }

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        });

        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados invalidos',
                message: error.details[0].message,
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context.value
                }))
            });
        }

        // Substitui os dados validados
        if (source === 'body') {
            req.body = value;
        } else if (source === 'params') {
            req.params = value;
        } else if (source === 'query') {
            req.query = value;
        }

        next();
    };
};

/**
 * Schemas de validação comuns
 */
const commonSchemas = {
    // Validação de ID de drone
    droneId: Joi.object({
    id: Joi.string().pattern(/^DRONE-\d+$/).required().messages({
    'string.pattern.base': 'ID do drone deve seguir o formato DRONE-{numero}'
    })
    }),

    // Validacao de ID de pedido
    orderId: Joi.object({
    id: Joi.string().pattern(/^ORDER-\d+$/).required().messages({
    'string.pattern.base': 'ID do pedido deve seguir o formato ORDER-{numero}'
    })
    }),

    // Validacao de paginacao
    pagination: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50).messages({
            'number.min': 'Limit deve ser pelo menos 1',
            'number.max': 'Limit nao pode exceder 100'
        }),
        offset: Joi.number().integer().min(0).default(0).messages({
            'number.min': 'Offset deve ser 0 ou maior'
        })
    }),

    // Validacao de coordenadas
    coordinates: Joi.object({
        x: Joi.number().min(0).max(20).required().messages({
            'number.min': 'Coordenada X deve estar entre 0 e 20',
            'number.max': 'Coordenada X deve estar entre 0 e 20'
        }),
        y: Joi.number().min(0).max(20).required().messages({
            'number.min': 'Coordenada Y deve estar entre 0 e 20',
            'number.max': 'Coordenada Y deve estar entre 0 e 20'
        })
    })
};

/**
 * Middleware de validação com schema personalizado
 * @param {Object} customSchema - Schema customizado
 * @param {string} source - Fonte dos dados
 */
const validate = (customSchema, source = 'body') => {
    return validateRequest(customSchema, source);
};

/**
 * Middleware para sanitizar dados de entrada
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        // Remove caracteres perigosos
        return str
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeString(obj[key]);
            } else if (typeof obj[key] === 'object') {
                obj[key] = sanitizeObject(obj[key]);
            }
        }
        return obj;
    };

    // Sanitiza body, params e query
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

/**
 * Middleware para rate limiting simples
 */
const rateLimiter = (windowMs = 60000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const clientId = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Limpa requisições antigas
        if (requests.has(clientId)) {
            const clientRequests = requests.get(clientId);
            const validRequests = clientRequests.filter(time => time > windowStart);
            
            if (validRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit excedido',
                    message: `Muitas requisicoes. Tente novamente em ${Math.ceil(windowMs / 1000)} segundos.`,
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
            
            validRequests.push(now);
            requests.set(clientId, validRequests);
        } else {
            requests.set(clientId, [now]);
        }

        next();
    };
};

module.exports = {
    validate,
    validateRequest,
    commonSchemas,
    sanitizeInput,
    rateLimiter
};