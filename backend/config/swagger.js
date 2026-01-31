import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Niti-Setu API',
      version: '1.0.0',
      description: 'Voice-Based Government Scheme Eligiblity Engine',
    },

    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

export default swaggerJsdoc(options);
