const mongoose = require('mongoose');

require('dotenv').config({ path: 'variables.env' });

const conectDB = async() => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('Data Base connected successfully...');
    } catch (error) {
        console.log('Error in DB connection');
        console.log(error);
        process.exit(1); // Se detiene aplicación
    }
}

module.exports = conectDB;