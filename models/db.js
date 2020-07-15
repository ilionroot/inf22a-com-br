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

mongoose.connect('mongodb+srv://ilion:marina2207@inf22a.zilou.mongodb.net/inf22a?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(()=>{
        console.log('Conectado com sucesso!');
    })
    .catch(e=>{
        console.log('Erro: ' + e);
    });
mongoose.Promise = global.Promise;

module.exports = mongoose;