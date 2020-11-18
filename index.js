const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const conectDB = require('./config/db');

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

// Conect to database
conectDB();

// Create server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
            const token = req.headers['authorization'] || '';
            if (token) {
                try {
                    const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);

                    return {
                        usuario
                    };
                } catch (error) {
                    console.log('Hubo un error:', error);
                }
            }
        }
        /* context: () => {
            const miContext = 'Nuevo context';
            return {
                miContext
            }
        } */
});

// Start server
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Server running in URL ${ url }`);
});