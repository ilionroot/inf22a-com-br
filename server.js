const express = require('express');
const app = express();

const Tarefa = require('./models/tarefa');
const User = require('./models/user');
const crypt = require('./crypto');

const handleBars = require('express-handlebars');
const HandleBars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const flush = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const server = require('http').createServer(app);
const io = require('socket.io')(server);

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

    function ext(extensao) {
        if (extensao == '.docx' | extensao == '.doc') {
            return '/docs/icons/docx.png';
        }
    
        if (extensao == '.xlsx') {
            return '/docs/icons/xlsx.png';
        }
    
        if (extensao == '.pdf') {
            return '/docs/icons/pdf.png';
        }
        
        if (extensao == '.pptx' | extensao == '.ppt' | extensao == '.pps') {
            return '/docs/icons/pptx.png';
        }
        
        if (extensao == '.exe') {
            return '/docs/icons/exe.png';
        }
    
        if (extensao == '.mov' | extensao == '.mp4' | extensao == '.avi' | extensao == '.flv' | extensao == '.wmv' | extensao == '.mkv' | extensao == '.rm') {
            return '/docs/icons/video.png'
        }
    
        return '/docs/icons/file.png';
    }

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'senha'
    }, async function(username,password,done) {
        await User.findOne( { email: username } ).then(async user=>{
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
        User.findOne( { _id: id } ).then(user=>{
            done(null, user.id);
        }).catch(err=>{
            done(err);
        })
    });
    
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
    app.use(express.static(path.join(__dirname, "gerador")));
    app.engine('html', handleBars({extname:'html', defaultLayout: 'main'}));
    app.set('view engine', 'html');

    app.use(express.static(path.resolve(__dirname, './docs')));
// Rotas

    app.get('/', (req, res) => {
        res.render('pages/home');
    })

    app.get('/agenda', (req, res) => {
        Tarefa.find().sort( { _id: '-1' } ).then(posts=>{ //DESC: do mais novo ao mais antigo //ASC: o inverso
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
            await Tarefa.find({
                titulo: new RegExp(req.body.barra, 'i'),
                materia: req.body.materia
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
            await Tarefa.find({
                titulo: new RegExp(req.body.barra, 'i')
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
				
        await Tarefa.findOne({ // Um problema resolvido
            _id: idPost
        }).then(data=>{
            var arquivo;

            if (data.anexos != null) {
                var extensao = '.' + (data.anexos.substr(data.anexos.lastIndexOf('.'))).split('.')[1].toLowerCase();
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
                    arquivo = ext(extensao);
                }
            }

            res.render('pages/post', {
                post: {
                    materia: data.materia,
                    titulo: data.titulo,
                    conteudo: data.conteudo,
                    limite: new Date((new Date(data.limite).setHours(new Date(data.limite).getHours() + 3))).toString().substr(0,21),
                    anexos: arquivo
                }
            });
        }).catch(err=>{
            res.send(err);
        })
    });

    app.post('/posts/:id', (req, res) => {
        Tarefa.findOne({
            _id: req.params.id
        }).then(data=>{
            var file = data.anexos;
            var path = require('path');

            var path1 = path.resolve('.') + '/public/docs/' + file;
            res.download(path1);
        })
    })

    app.get('/login', (req, res) => {
        if(req.query.fail)
            res.render('pages/login', { message: 'Usuário e/ou senha incorretos!' });
         else
            res.render('pages/login', { successuser: req.flash('successuser') });
    });

    app.post('/login', passport.authenticate('local', { failureRedirect: '/login?fail=true' }), (req, res) => {
        res.redirect('/admin');
    });

    app.get('/chat', isAdm, (req, res) => {
        res.redirect('/chat/in?admin=true');
    });

    app.get('/set-username', (req, res)=>{
        res.render('pages/set-username');
    });

    app.post('/set-username', (req, res)=>{
				tempUser = req.body.username;
				
        res.redirect('/chat/in?admin=false');
    });

    app.get('/chat/in', (req, res)=>{
        if(req.query.admin == 'true') {
            User.findOne({
                _id: req.user
            }).then(data=>{
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
        socket.join('public');
        io.sockets.in('public').emit('lastMessages', msgs);

        socket.on('public', message=>{
            msgs.push(message);
            io.sockets.in('public').emit('receivePublicMessage', message);
        });

        socket.on('private', (msg)=>{
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
        });
    });

    // Listen on a specific host via the HOST environment variable
    var host = process.env.HOST || '0.0.0.0';
    // Listen on a specific port via the PORT environment variable
    var port = process.env.PORT || 8080;
    
    // var cors_proxy = require('cors-anywhere');
    // cors_proxy.createServer({
    //     originWhitelist: [], // Allow all origins
    //     requireHeader: ['origin', 'x-requested-with'],
    //     removeHeaders: ['cookie', 'cookie2']
    // }).listen(port, host, function() {
    //     console.log('Running CORS Anywhere on ' + host + ':' + port);
    // });

    app.get('/gerador', (req, res) => {
        res.header("Access-Control-Allow-Headers", "x-requested-with, x-requested-by");
        res.sendFile(__dirname + '/gerador/plantas.html');
    });

    app.get('/wikipedia', (req, res) => {
        res.header("Access-Control-Allow-Headers", "x-requested-with, x-requested-by");
        res.sendFile(__dirname + '/gerador/wikipedia.html');
    });

    app.get('/recover-password', async (req, res) => {
        res.render('pages/recover-email', {
            doesnt: req.flash('already'),
            success: req.flash('successuser'),
            error: req.flash('error')
        });
    });

    const hbs = require('nodemailer-express-handlebars');
    const crypto = require('crypto');

    app.post('/recover-password', async (req, res) => {
        await User.findOne({ email: req.body.email }).then(async user=>{
            if (!user) { req.flash('already', 'E-mail não cadastrado!'); return res.redirect('/recover-password') }
            
            const token = await crypto.randomBytes(20).toString('hex');
            const now = new Date();
            now.setHours(now.getHours() + 1);

            await User.updateOne({ _id: user.id }, {
                $set: {
                    passwordResetToken: token,
                    passwordResetExpires: now
                }
            });

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: "noreply.inf22a@gmail.com",
                    pass: "marina2207"
                },
                tls: { rejectUnauthorized: false }
            });
    
            transporter.use('compile', hbs({
                viewEngine: {
                    extName: '.html',
                    partialsDir: './mail/',
                    layoutsDir: './mail/',
                },
                viewPath: './mail/',
                extName: '.html'
            }));
    
            const mailOptions = {
                from: 'noreply.inf22a@gmail.com',
                to: user.email,
                template: 'email-recover-password',
                context: { token, nickname: user.username },
                subject: 'Recuperação de senha - INF22A',
            };

            transporter.sendMail(mailOptions, function(err, info){
                if (err) {
                    console.log(err);
                    req.flash('error', 'Não foi possível enviar o seu e-mail: ' + err);
                    res.redirect('/recover-password');
                } else {
                    req.flash('successuser', 'E-mail enviado com sucesso! (Verifique a caixa de SPAM e a Lixeira)');
                    res.redirect('/recover-password');
                }
            });
        }).catch(err=>{
            req.flash('error', 'Não foi possível enviar o seu e-mail: ' + err);
            res.redirect('/recover-password');
        });
    });
		
    app.get('/reset-password/:token', async (req, res) => {
        await User.find({ passwordResetToken: req.params.token }).then(user=>{
            res.render('pages/reset-password', {
                nickname: user.username,
                error: req.flash('error'),
                success: req.flash('successuser'),
                dmatch: req.flash('already'),
            });
        }).catch(err=>{ console.log(err); return res.status(400).send({ error: 'Não foi possível carregar a página!' }); });
    });

    app.post('/reset-password/:token', async (req, res) => {
        const token = req.params.token;
        const { password, cpassword } = req.body;

        try {
            if (!password === cpassword) {
                req.flash('already', 'As senhas não coincidem!');
                return res.redirect('/reset-password/' + token);
            }

            const user = await User.findOne({ passwordResetToken: token })
                .select('+passwordResetToken passwordResetExpires');

            if (!user) {
                req.flash('error', 'Esse token não pertence a ninguém, espertinho!');
                return res.redirect('/login');
            }

            if (token !== user.passwordResetToken) {
                req.flash('error', 'Esse token não pertence a ninguém, espertinho!');
                return res.redirect('/login');
            }

            const now = new Date();

            if (now > user.passwordResetExpires) {
                req.flash('error', 'Token expirado!');
                return res.redirect('/login');;
            }

            user.password = crypt.crypt(password);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save();

            req.flash('successuser', 'Sua senha foi alterada com sucesso!');
            res.redirect('/login');
        } catch (err) {
            req.flash('error', 'Não foi possível alterar a sua senha: ' + err);
            res.redirect('/login');
        }
		});

		app.use('/admin', require('./routes/admin'));
		app.use('/player', require('./music_player/player')(server));

    app.use((req, res, next) => {
        res.status(404).render('pages/404');
    })

server.listen(process.env.PORT || 3000, ()=>{
    console.log('Server rodando na porta: 3000');
});