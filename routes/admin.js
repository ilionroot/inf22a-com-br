var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const authenticationMiddleware = require('../middlewares/authMiddleware').auth;
const Tarefa = require('../models/tarefa');
const User = require('../models/user');
const Playlist = require('../models/playlist');
const crypt = require('../crypto');

const Youtube = require('simple-youtube-api');
const youtube = new Youtube(require('../music_player/configs/configs').googleAPI);

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
        res.render('pages/admin', {
            data: data,
            message: req.flash('success'),
            results: false,
        });
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

        res.render('pages/edit', {
            anexos: arquivo,
            materia: data.materia,
            titulo: data.titulo,
            conteudo: data.conteudo,
            limite: (new Date(data.limite).toISOString().slice(0, 19)),
            error: req.flash('error')
        });
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

router.get('/editar-playlist', async (req, res) => {
    const playlist = await Playlist.find();

    const infos = {
        playlistInfos: await playlist.map(item => {
            return {
                id: item.id,
                title: item.title,
                autor: item.autor
            }
        })
    }

    res.render('pages/editar-playlist', {
        musica: infos.playlistInfos,
        message: req.flash('success'),
        error: req.flash('error'),
        already: req.flash('already')
    });
});

router.post('/editar-playlist', async(req, res) => {
    const { id } = req.body;

    if (!id) {
        const { searchBar } = req.body;

        await youtube.searchVideos(searchBar, 1).then(async video => {
            console.log('Adicionando...');

            Playlist.findOne({ id: video[0].id }).then(teste => {
                if (!teste) {
                    Playlist.create({
                        id: video[0].id,
                        title: video[0].title,
                        autor: video[0].raw.snippet.channelTitle,
                        thumb: video[0].thumbnails.high.url,
                    }).then(() => {
                        console.log(`Música "${video[0].title}" adicionada com sucesso!`);
                        req.flash('success', 'Música adicionada com sucesso!');
                        return res.redirect('/admin/editar-playlist');
                    });
                } else {
                    req.flash('already', 'Música existente!');
                    return res.redirect('/admin/editar-playlist');
                }
            });
        }).catch(err => {
            req.flash('error', `Erro: ${err}`);
            return res.redirect('/admin/editar-playlist');
        })
    } else {
        await Playlist.deleteOne({ id }).then(() => {
            req.flash('success', 'Música removida com sucesso!');
            res.redirect('/admin/editar-playlist');
        }).catch(err => {
            req.flash('error', `Erro: ${err}`);
            res.redirect('/admin/editar-playlist');
        })
    }
});

module.exports = router;