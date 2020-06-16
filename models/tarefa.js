const db = require('./db');

const Tarefa = db.sequelize.define('agendoca',{
    materia: {
        type: db.Sequelize.STRING
    },
    titulo: {
        type: db.Sequelize.STRING
    },
    conteudo: {
        type: db.Sequelize.STRING
    },
    anexos: {
        type: db.Sequelize.STRING
    },
    limite: {
        type: db.Sequelize.DATE
    }
});

//Tarefa.sync({ force: true });

module.exports = Tarefa;