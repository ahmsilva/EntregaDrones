/**
 * Middleware - Error Handler
 * Tratamento centralizado de erros da API
 */

const errorHandler = (err, req, res, next) => {
    console.error('Erro capturado pelo middleware:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    // Erro de validação do Joi
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            message: err.details[0].message,
            details: err.details
        });
    }

    // Erro de sintaxe JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'JSON inválido',
            message: 'Formato JSON malformado'
        });
    }

    // Erro de payload muito grande
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'Payload muito grande',
            message: 'Tamanho da requisição excede o limite permitido'
        });
    }

    // Erro de timeout
    if (err.code === 'ETIMEDOUT' || err.timeout) {
        return res.status(408).json({
            success: false,
            error: 'Timeout',
            message: 'Tempo limite da requisição excedido'
        });
    }

    // Erro personalizado da aplicação
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.name || 'Erro da aplicação',
            message: err.message
        });
    }

    // Erro interno do servidor
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: isDevelopment ? err.message : 'Algo deu errado. Tente novamente mais tarde.',
        ...(isDevelopment && { stack: err.stack })
    });
};

module.exports = errorHandler;