const express = require('express');
const app = express();

const Tarefa = require('./models/tarefa');
const User = require('./models/user');

const handleBars = require('express-handlebars');
const HandleBars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');

const flush = require('connect-flash');
const sequelize = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "docs/");
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({storage});
const fs = require('fs');

// Passport e Sessão
    app.use(cookieParser());
    app.use(flush());
    app.use(session({ 
        cookie: {
           maxAge: 1000 * 60 * 60 *  2,
        },
       secret: 'o igoncio eh masser dms!',
       resave: false,
       saveUninitialized: true
   }), (req, res, next) => {
       next();
   });
   app.use(passport.initialize());
   app.use(passport.session());

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'senha'
    }, function(username,password,done) {
        console.log(username);
        console.log('isso eh um callback');

        User.findOne( { where: { email: username } }).then(async user=>{
            if ( !user ) {
                return done(null, false, { message: 'Incorrect username!' });
            }

            if (await bcrypt.compare(password, user.password)) { console.log('Logou!'); return done(false,user, { message: 'Logou!' }) }
            else {
                console.log('INCORRECT PASSWORD!');
                return done(null, false, { message: 'Incorrect PASSWORD!' });
            }
        }
        )
        .catch(err=>{ return done(err); })
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    })

    passport.deserializeUser((id, done) => {
        User.findOne( {where:{id: id}}).then(user=>{
            done(null, user.id);
        }).catch(err=>{
            done(err);
        })
    });

    const authenticationMiddleware = (req, res, next) => {  
        if (req.isAuthenticated()) {
            return next();
        }

        res.redirect('/login?fail=true');
    }
 
// Configs
    HandleBars.registerHelper('isdefined', function (value) {
        return value !== null;
    });

    app.use(express.static(path.join(__dirname, "public")))
    app.engine('handlebars', handleBars({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    app.use(express.urlencoded({ extended: true }));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(express.static(path.resolve(__dirname, './docs')));
// Rotas

    app.get('/', (req, res) => {
        res.render('pages/home');
    })

    app.get('/agenda', (req, res) => {
        Tarefa.findAll({order: [['id', 'DESC']]}).then(posts=>{ //DESC: do mais novo ao mais antigo //ASC: o inverso
            const informations = {
                postDocuments: posts.map(document => {
                  return {
                    id: document.id,
                    materia: document.materia,
                    titulo: document.titulo,
                    conteudo: document.conteudo,
                    limite: new Date((new Date(document.limite).setHours(new Date(document.limite).getHours() + 3)))
                  }
                })
              }
            
            res.render('pages/agenda', {
                posts: informations.postDocuments
            });
        });
    })

    app.get('/posts/:id', (req, res) => {
        Tarefa.findOne({
            where: {
                id: req.params.id
            }
        }).then(data=>{
            res.render('pages/post', {
                post: {
                    materia: data.materia,
                    titulo: data.titulo,
                    conteudo: data.conteudo,
                    limite: new Date((new Date(data.limite).setHours(new Date(data.limite).getHours() + 3))).toString().substr(0,21),
                    anexos: data.anexos
                }
            });
        }).catch(err=>{
            throw err;
        })
    });

    app.post('/posts/:id', (req, res) => {
        Tarefa.findOne({
            where: {
                id: req.params.id
            }
        }).then(data=>{
            var file = data.anexos;
            var path = require('path');
            console.log(file);

            var path1 = path.resolve('.') + '/docs/' + file;
            res.download(path1);
        })
    })

    app.get('/admin/postar', authenticationMiddleware, (req, res) => {
        res.render('pages/postar');
    })

    app.post('/admin/postar', authenticationMiddleware, upload.single('fileSender'), (req, res) => {
        var data = new Date(new Date(req.body.prazo) - new Date(req.body.prazo).getTimezoneOffset() * 60000);

        var arquivo;

        if(req.file!=null) {
            arquivo = req.file.filename
        }
        
        Tarefa.create({
            titulo: req.body.titulo,
            materia: req.body.materia,
            conteudo: req.body.conteudo,
            anexos: arquivo,
            limite: data
        }).then(()=>{
            req.flash('success', 'Postagem realizada com sucesso!');
            res.redirect('/admin');
        }).catch(err=>{
            throw err;
        })
    });

    app.get('/admin', authenticationMiddleware, async (req, res)=>{
        var qtdCards = await Tarefa.count({group: ["materia"]}).then(data=>{
            res.render('pages/admin', {
                data: data,
                message: req.flash('success')
            });

            console.log(data);
        }).catch(err=>{
            throw err;
        })
    })

    app.get('/admin/materia/:materia', authenticationMiddleware, async (req, res)=>{
        Tarefa.findAll({
            where: {
                materia: req.params.materia
            },
            order: [['id', 'DESC']]
        }).then(data=>{
            const informations = {
                postDocuments: data.map(document=>{
                    return {
                        id: document.id,
                        limite: new Date((new Date(document.limite).setHours(new Date(document.limite).getHours() + 3))).toString().substr(0,21),
                        titulo: document.titulo,
                        materia: document.materia,
                        conteudo: document.conteudo,
                        anexos: document.anexos
                    }
                })
            }
            
            res.render('pages/materia', {
                post: informations.postDocuments
            });
        }).catch(err=>{
            throw err;
        })
    })

    app.get('/admin/delete/:id', authenticationMiddleware, (req, res) => {
        res.render('pages/delete');
    })

    app.post('/admin/delete/:id', authenticationMiddleware, (req, res) => {
        Tarefa.destroy({
            where: {
                id: req.params.id
            }
        }).then(()=>{
            req.flash('success', 'Postagem excluída com sucesso!');
            res.redirect('/admin');
        }).catch(err=>{
            throw err;
        })
    })

    app.get('/admin/edit/:id', authenticationMiddleware, (req, res) => {
        Tarefa.findOne({where: {
            id: req.params.id
        }}).then(data=>{
            res.render('pages/edit', {
                materia: data.materia,
                titulo: data.titulo,
                conteudo: data.conteudo,
                limite: (new Date(data.limite).toISOString().slice(0, 19))
            });

            console.log(data.limite);
        }).catch(err=>{
            req.flash('error', 'Falha ao carregar página: ' + err);
            throw err;
        })
    })

    app.post('/admin/edit/:id', authenticationMiddleware, (req, res) => {
        var data = new Date(new Date(req.body.prazo) - new Date(req.body.prazo).getTimezoneOffset() * 60000);
        
        Tarefa.update({
            titulo: req.body.titulo,
            materia: req.body.materia,
            limite: data,
            conteudo: req.body.conteudo
        }, {where: {
            id: req.params.id
        }}).then(()=>{
            req.flash('success', 'Postagem editada com sucesso!');
            res.redirect('/admin');
        }).catch(err=>{
            throw err;
        })
    });

    app.get('/login', (req, res) => {
        if(req.query.fail)
            res.render('pages/login', { message: 'Usuário e/ou senha incorretos!' });
         else
            res.render('pages/login', { successuser: req.flash('successuser') });
    });

    app.post('/login', passport.authenticate('local', { failureRedirect: '/login?fail=true' }), (req, res) => {
        res.redirect('/admin');
    });

    app.get('/register',(req, res) => {
        res.render('pages/register', {
            message: req.flash('passwords'),
            error: req.flash('error'),
            already: req.flash('already')
        });
    });

    app.post('/register', (req, res) => {
        var usuario = req.body.usuario;
        var email = req.body.email;
        var senha = req.body.senha;
        var csenha = req.body.csenha;

        if(csenha === senha) {
            User.findOne({
                where: {
                    email: email
                }
            }).then(async result => {
                if(!result) {
                    var senhaBanco = await bcrypt.hash(senha, 10);
                    console.log(senhaBanco + " eu sou o Igor");

                    User.create({
                        username: usuario,
                        email: email,
                        password: senhaBanco
                    }).then(()=>{
                        req.flash('successuser', 'Usuário cadastrado com sucesso!');
                        res.redirect('/login');
                    }).catch(err=>{
                        req.flash('error', 'Erro ao cadastrar usuário!');
                        res.redirect('/register');
                    })
                } else {
                    req.flash('already', 'Usuário já cadastrado!');
                    res.redirect('/register');
                }
            }).catch(err => {
                req.flash('error', 'Erro ao cadastrar usuário!');
                res.redirect('/register');
            })
        } else {
            req.flash('passwords', 'As senhas não coincidem!');
            res.redirect('/register');
        }
    });

app.listen(3000, ()=>{
    console.log('Server rodando na porta: 3000');
});

