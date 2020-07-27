// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('school','igoncio','marina2207',{
//     host: 'mysql669.umbler.com',
//     port: 41890,
//     dialect: 'mysql'
// });

// module.exports = {
//     Sequelize: Sequelize,
//     sequelize: sequelize
// }

const mongoose = require('mongoose');

mongoose.connect('mongodb://igoncio:d7i6rqeZ8D4oqt5q@inf22a-shard-00-00.zilou.mongodb.net:27017,inf22a-shard-00-01.zilou.mongodb.net:27017,inf22a-shard-00-02.zilou.mongodb.net:27017/inf22a?ssl=true&replicaSet=atlas-o4ztp8-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=>{
        console.log('Conectado com sucesso!');
    })
    .catch(e=>{
        throw e;
    });
mongoose.Promise = global.Promise;

module.exports = mongoose;