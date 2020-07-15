const mongoose = require('./db');

const TarefaSchema = new mongoose.Schema({
    materia: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    anexos: {
        type: String,
    },
    limite: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const Tarefa = mongoose.model('Tarefa', TarefaSchema);

module.exports = Tarefa;

//Tarefa.sync({ force: true });