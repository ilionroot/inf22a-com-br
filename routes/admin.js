var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sequelize = require('sequelize');
const Op = sequelize.Op;

const authenticationMiddleware = require('../middlewares/authMiddleware').auth;
const Tarefa = require('../models/tarefa');
const User = require('../models/user');
const crypt = require('../crypto');
const { lookup } = require('dns');

router.use(express.static(path.join(__dirname, "public")));
router.use(authenticationMiddleware);

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, path.resolve('.') + '/public/docs');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {fileSize: 25000000}
});

router.get('/postar', (req, res) => {
    res.render('pages/postar',{
        tooLarge: req.flash('tooLarge'),
        error: req.flash('error')
    });
})

router.post('/postar', upload.single('fileSender'), async (req, res) => {
    var data = new Date(new Date(req.body.prazo) - new Date(req.body.prazo).getTimezoneOffset() * 60000);
    console.log(req.body.conteudo);

    var arquivo;
    
    if(req.file != null && req.file != undefined) {
        arquivo = req.file.filename;
    }

    await Tarefa.create({
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

router.get('/', async (req, res)=>{
    var qtdCards = await Tarefa.aggregate([
        {
            $group: {
                _id: "$materia",
                count: { $sum: 1 }
            }
        }
    ]).then(data=>{
        console.log(data);
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

router.get('/search/', async (req, res) => {
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

router.get('/materia/:materia', async (req, res)=>{
    await Tarefa.find({
        materia: req.params.materia
    }).sort( { _id: '-1' } ).then(data=>{
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

router.post('/materia/:materia', async (req, res)=>{
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

router.get('/delete/:id', (req, res) => {
    res.render('pages/delete');
})

router.post('/delete/:id', (req, res) => {
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

router.get('/edit/:id', (req, res) => {
    Tarefa.findOne({
        _id: req.params.id
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

        console.log(arquivo);

        res.render('pages/edit', {
            anexos: arquivo,
            materia: data.materia,
            titulo: data.titulo,
            conteudo: data.conteudo,
            limite: (new Date(data.limite).toISOString().slice(0, 19)),
            error: req.flash('error')
        });

        console.log(data.limite);
    }).catch(err=>{
        req.flash('error', 'Falha ao carregar página: ' + err);
        res.redirect('/admin');
    })
})

router.post('/edit/:id', upload.single('fileSender'), (req, res) => {
    var data = new Date(new Date(req.body.prazo) - new Date(req.body.prazo).getTimezoneOffset() * 60000);
    
    var arquivo;
    
    if(req.file != null && req.file != undefined) {
        arquivo = req.file.filename;
    }

    Tarefa.update({_id:req.params.id},{
        $set: {
            titulo: req.body.titulo,
            materia: req.body.materia,
            limite: data,
            conteudo: req.body.conteudo,
            anexos: arquivo
        }
    }).then(()=>{
        req.flash('success', 'Postagem editada com sucesso!');
        res.redirect('/admin');
    }).catch(err=>{
        throw err;
    })
});

router.get('/register', (req, res) => {
    res.render('pages/register', {
        message: req.flash('passwords'),
        error: req.flash('error'),
        already: req.flash('already')
    });
});

router.post('/register', (req, res) => {
    var usuario = req.body.usuario;
    var email = req.body.email;
    var senha = req.body.senha;
    var csenha = req.body.csenha;

    if(csenha === senha) {
        User.findOne({
            email: email
        }).then(async result => {
            if(!result) {
                var senhaBanco = await crypt.crypt(senha);
                console.log(senhaBanco + " eu sou o Igor");

                await User.create({
                    username: usuario,
                    email: email,
                    password: senhaBanco
                }).then(()=>{
                    req.flash('successuser', 'Usuário cadastrado com sucesso!');
                    res.redirect('/login');
                }).catch(err=>{
                    console.log(err);
                    req.flash('error', 'Erro ao cadastrar usuário!');
                    res.redirect('/admin/register');
                })
            } else {
                req.flash('already', 'Usuário já cadastrado!');
                res.redirect('/admin/register');
            }
        }).catch(err => {
            console.log(err);
            req.flash('error', 'Erro ao cadastrar usuário!');
            res.redirect('/admin/register');
        })
    } else {
        req.flash('passwords', 'As senhas não coincidem!');
        res.redirect('/admin/register');
    }
});

router.get('/contatar-professores', async (req, res) => {
    res.render('pages/contatar-professores');
});

module.exports = router;