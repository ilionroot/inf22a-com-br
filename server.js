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
const Op = sequelize.Op;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypt = require('./crypto');

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, __dirname + "/public/docs/");
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {fileSize: 25000000}
});

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

            var senha = await crypt.crypt(password);

            if (user.password === senha) { console.log('Logou!'); return done(false,user, { message: 'Logou!' }) }
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

    var tempUser = undefined;

    const isAdm = (req, res, next) => {  
        if (req.isAuthenticated()) {
            return next();
        }

        if (tempUser == undefined) {
            res.redirect('/set-username');
        } else {
            res.redirect('/chat/in?admin=false');
        }
    }
 
// Configs
    app.use(express.urlencoded({ extended: true }));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    HandleBars.registerHelper('isdefined', function (value) {
        return value !== null;
    });

    app.use(express.static(path.join(__dirname, "public")));
    app.engine('handlebars', handleBars({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

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
                    limite: new Date((new Date(document.limite).setHours(new Date(document.limite).getHours() + 3))).toString().substr(0,21)
                  }
                })
            }
            
            res.render('pages/agenda', {
                posts: informations.postDocuments
            });
        });
    });

    app.post('/agenda', async (req, res) => {
        if (req.body.materia != "Todas") {
            await Tarefa.findAll({
                where: {
                    titulo: {
                        [Op.like]: '%' + req.body.barra + '%'
                    },
                    materia: req.body.materia
                }
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
    
                res.render('pages/agenda', {
                    posts: informations.postDocuments,
                    search: req.body.barra.split(' '),
                    materia: req.params.materia
                });
            }).catch(err=>{
                throw err;
            });
        } else {
            await Tarefa.findAll({
                where: {
                    titulo: {
                        [Op.like]: '%' + req.body.barra + '%'
                    }
                }
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
    
                res.render('pages/agenda', {
                    posts: informations.postDocuments,
                    search: req.body.barra.split(' '),
                    materia: req.params.materia
                });
            }).catch(err=>{
                throw err;
            });
        }
    });

    app.get('/posts/:id', async (req, res) => {
        var idPost = req.params.id;
        console.log(idPost);

        await Tarefa.findOne({ // Um problema resolvido
            where: {
                id: idPost
            }
        }).then(data=>{
            if(true) {
                var arquivo;

                if (data.anexos != null) {
                    var extensao = (data.anexos.substring(data.anexos.lastIndexOf("."))).toLowerCase();
                    var img = new Array(".gif", ".jpg", ".png", ".jpeg", ".bmp", ".svg", ".tiff");

                    var ver = false;

                    for (var i = 0; i < img.length; i++) {
                        if(extensao == img[i]) {
                            ver = true;
                            break;
                        }
                    }

                    if (ver) {
                        arquivo = '/docs/' + data.anexos;
                    } else {
                        if (extensao == '.docx' | extensao == '.doc') {
                            arquivo = '/docs/icons/docx.png';
                        }

                        if (extensao == '.xlsx') {
                            arquivo = '/docs/icons/xlsx.png';
                        }

                        if (extensao == '.pdf') {
                            arquivo = '/docs/icons/pdf.png';
                        }
                        
                        if (extensao == '.pptx' | extensao == '.ppt' | extensao == '.pps') {
                            arquivo = '/docs/icons/pptx.png';
                        }
                        
                        if (extensao == '.exe') {
                            arquivo = '/docs/icons/exe.png';
                        }

                        if (extensao == '.mov' | extensao == '.mp4' | extensao == '.avi' | extensao == '.flv' | extensao == '.wmv' | extensao == '.mkv' | extensao == '.rm') {
                            arquivo = '/docs/icons/video.png'
                        } else {
                            arquivo = '/docs/icons/file.png';
                        }
                    }
                }

                console.log(arquivo);

                res.render('pages/post', {
                    post: {
                        materia: data.materia,
                            titulo: data.titulo,
                            conteudo: data.conteudo,
                            limite: new Date((new Date(data.limite).setHours(new Date(data.limite).getHours() + 3))).toString().substr(0,21),
                            anexos: arquivo
                    }
                });
            }
        }).catch(err=>{
            res.send(err);
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

            var path1 = path.resolve('.') + '/public/docs/' + file;
            res.download(path1);
        })
    })

    app.get('/admin/postar', authenticationMiddleware, (req, res) => {
        res.render('pages/postar',{
            tooLarge: req.flash('tooLarge'),
            error: req.flash('error')
        });
    })

    app.post('/admin/postar', upload.single('fileSender'), authenticationMiddleware, (req, res) => {
        var data = new Date(new Date(req.body.prazo) - new Date(req.body.prazo).getTimezoneOffset() * 60000);
        console.log(req.body.conteudo);

        var arquivo;
        
        if(req.file != null && req.file != undefined) {
            arquivo = req.file.filename;
        }

        Tarefa.create({
            titulo: req.body.titulo,
            materia: req.body.materia,
            conteudo: req.body.conteudo,
            anexos: arquivo,
            limite: data
        }).then(()=>{
            req.flash('success', 'Postagem realizada com sucesso!');
            console.log("Arquivo: " + arquivo);
            console.log("Data: " + data);
            res.redirect('/admin');
        }).catch(err=>{
            req.flash('error', 'Erro ao realizar postagem!');
        })
    });

    app.get('/admin', authenticationMiddleware, async (req, res)=>{
        var qtdCards = await Tarefa.count({group: ["materia"]}).then(data=>{
            res.render('pages/admin', {
                data: data,
                message: req.flash('success'),
                results: false,
            });

            console.log(data);
        }).catch(err=>{
            throw err;
        })
    });

    app.get('/admin/search/', authenticationMiddleware, async (req, res) => {
        var searchParams = req.query.barra.split(' ');

        await Tarefa.count({
            group: ["materia"],
            where: {
                materia: {
                    [Op.like]: '%' + searchParams + '%'
                }
            }
        }).then(data=>{
            console.log(data);

            const information = {
                postInfos: data.map(document => {
                  return {
                    materia: document.materia,
                    count: document.count
                  }
                })
            }

            res.render('pages/admin', {
                data: information.postInfos,
                results: true,
                search: searchParams
            })
        })
    });

    app.get('/admin/materia/:materia', authenticationMiddleware, async (req, res)=>{
        await Tarefa.findAll({
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

            console.log(data.id);
        }).catch(err=>{
            throw err;
        })
    })

    app.post('/admin/materia/:materia', authenticationMiddleware, async (req, res)=>{
        await Tarefa.findAll({
            where: {
                titulo: {
                    [Op.like]: '%' + req.body.barra + '%'
                },
                materia: req.params.materia
            }
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
                post: informations.postDocuments,
                search: req.body.barra.split(' '),
                materia: req.params.materia
            });
        }).catch(err=>{
            throw err;
        });
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
                limite: (new Date(data.limite).toISOString().slice(0, 19)),
                error: req.flash('error')
            });

            console.log(data.limite);
        }).catch(err=>{
            req.flash('error', 'Falha ao carregar página: ' + err);
            res.redirect('/admin/edit/' + req.params.id);
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

    app.get('/register', authenticationMiddleware, (req, res) => {
        res.render('pages/register', {
            message: req.flash('passwords'),
            error: req.flash('error'),
            already: req.flash('already')
        });
    });

    app.post('/register', authenticationMiddleware, (req, res) => {
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
                    var senhaBanco = await crypt.crypt(senha);
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

    app.get('/chat', isAdm, (req, res) => {
        res.redirect('/chat/in?admin=true');
    });

    app.get('/set-username', (req, res)=>{
        res.render('pages/set-username');
    });

    app.post('/set-username', (req, res)=>{
        tempUser = req.body.username;
        console.log(tempUser);

        res.redirect('/chat/in?admin=false');
    });

    app.get('/chat/in', (req, res)=>{
        if(req.query.admin == 'true') {
            User.findOne({where: {
                id: req.user
            }}).then(data=>{
                console.log(data.username);
                
                res.render('pages/chat', {
                    user: data.username
                });
            }).catch(err=>{
                res.send(err);
            })
        } else if (req.query.admin == 'false'){
            res.render('pages/chat', {
                user: tempUser
            });
        }
    });

    var msgs = [];

    io.on('connection', socket=>{
        console.log('Usuário: ' + socket.id + ' conectou!');

        socket.join('public');
        io.sockets.in('public').emit('lastMessages', msgs);

        socket.on('public', message=>{
            msgs.push(message);
            io.sockets.in('public').emit('receivePublicMessage', message);
        });

        socket.on('private', (msg)=>{
            console.log(msg.ademe + " lidia");
            io.sockets.in(msg.ademe).emit('receivePrivateMessage', msg);
        });

        socket.on('publicRoom', (autor, ademe)=>{
            socket.leave(ademe);

            io.sockets.in(ademe).emit('receivePublicMessage', {
                autor: 'Sistema',
                message: autor + ' saiu da sala!'
            });

            socket.join('public');
            socket.emit('lastMessages', msgs);
        });

        socket.on('privateRoom', (adm)=>{
            socket.leave('public');

            io.sockets.in('public').emit('receivePublicMessage', {
                autor: 'Sistema',
                message: adm.autor + ' saiu da sala!'
            });

            socket.join(adm.adm);

            var lasts = {
                autor: 'Sistema',
                message: 'Você está em um chat privado com ' + adm.adm + '!'
            }

            socket.emit('lastMessages', {
                lasts
            });
        });

        socket.on('disconnect', function() {
            console.log('Usuário desconectado: ' + socket.id);
        });
    });

server.listen(process.env.PORT || 3000, ()=>{
    console.log('Server rodando na porta: 3000');
});