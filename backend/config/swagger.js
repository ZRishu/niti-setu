const { version } = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    defination: {
        openapi: '3.0.0',
        info: {
            title: 'Niti-Setu API',
            version: '1.0.0',
            description: 'Voice-Based Government Scheme Eligiblity Engine'
        },
    
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Local Development Server'
            },
        ],
    },
    api: ['./routes/*.js', './models/*.js']
};

module.exports = swaggerJsdoc(options)
