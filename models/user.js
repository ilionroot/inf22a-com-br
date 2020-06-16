const db = require('./db');

const User = db.sequelize.define('users',{
    username: {
        type: db.Sequelize.STRING
    },
    password: {
        type: db.Sequelize.STRING
    },
    email: {
        type: db.Sequelize.STRING
    }
});

//User.sync({ force: true });

module.exports = User;