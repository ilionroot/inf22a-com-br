module.exports = (server) => {
	const express = require('express');
	const router = express.Router();

	const exphbs = require('express-handlebars');
	const bodyParser = require('body-parser');
	const path = require('path');
	const Youtube = require('simple-youtube-api');
	const youtube = new Youtube(require('./configs/configs').googleAPI);
	const fs = require('fs');
	const getStat = require('util').promisify(fs.stat);
	let io = require('socket.io')(server);
	const youtubeStream = require('youtube-audio-stream');
	const Playlist = require('../models/playlist');

	io.sockets.setMaxListeners(5);

	router.use(bodyParser.urlencoded({ extended: true }));
	router.use(bodyParser.json());

	router.use(express.static(path.join(__dirname, 'ppublic')));

	let mscs;

	const middle = async (req, res, next) => {
		try {
			mscs = await Playlist.find();
			next();
		} catch (error) {
			next();
		}
	};

	router.get('/', middle, async (req, res) => {
		if (mscs) {
			if (mscs.length == 0) {
				io.on('connection', socket => {
					socket.emit('load', {
						ans: true
					});
				});
				return res.render('pages/hp', { layout: 'mp', });
			}

			const infos = {
				playlistInfo: await mscs.map(item => {
					return {
						id: item.id,
						title: item.title
					}
				})
			}

			res.render('pages/player', {
                layout: 'mp',
				musica: infos.playlistInfo,
			});

			io.on('connection', socket => {
				socket.emit('load', {
					ans: true
				});
			});
		} else {
			res.render('pages/hp', {layout: 'mp'});

			io.on('connection', socket => {
				console.log('<----->Configurando API...<----->');

				socket.emit('load', {
					ans: true,
				});

				console.log('<----->Siga as instruções na tela para terminar a configuração...<----->');
			});
		}
	});

	router.post('/', async (req, res) => {
		if (req.user) {
			let { pesquisa } = req.body;
			console.log(pesquisa);

			await youtube.searchVideos(pesquisa, 1).then(async video => {
				console.log('Adicionando...');
				
				Playlist.findOne({ id: video[0].id }).then(teste => {
					if (!teste) {
						Playlist.create({
							id: video[0].id,
							title: video[0].title,
							autor: video[0].raw.snippet.channelTitle,
							thumb: video[0].thumbnails.high.url,
						}).then(() => {
							console.log(`Música ${video[0].title} adicionada com sucesso!`);
							res.redirect('/player');
						});
					} else {
						res.send('Música existente!');
					}
				});
			}).catch(err => {
				console.log('Erro personalizado: ' + err);
				res.status(404);
			})
		} else {
			res.redirect('/login?fail=true');
		}
	});

	router.get('/audio', async (req, res) => {
		if (!mscs) {
			mscs = await Playlist.find();
		}

		if (!req.query.id) {
			try {
				let index = Math.floor(Math.random() * mscs.length);
				let file = mscs[index].title;
		
				// await fs.createReadStream(filePath);
		
				let contentAutor = '';
				let contentThumb = '';
				let contentTitle = () => {
					try {
						for(let index in mscs) {
							if (mscs[index].title == file) {
								contentAutor = mscs[index].autor;
								contentThumb = mscs[index].thumb;
								return mscs[index].title.split('.')[0];
							}
						}
					} catch (error) {
						console.log("Erro: " + error);	
					}
				}
		
				let stream = youtubeStream('http://www.youtube.com/embed/' + (await function() {
					for (let video in mscs) {
						if (mscs[video].title == file) {
							return mscs[video].id;
						}
					}
				})());
		
				stream.pipe(res).on('finish', () => { console.log('O socket baixou a música!'); });
				let content = await contentTitle();
		
				res.writeHead(200, {
					'Content-Type': 'audio/mp3',
					// 'Content-Length': stat.size,
					// 'Content-Title': content,
					// 'Content-Author': contentAutor,
					// 'Content-Thumb': contentThumb
				});
		
				io = require('socket.io')(server);
		
				await io.on('connection', async socket => {
					socket.emit('load', {
						ans: true,
						titulo: content,
						autor: contentAutor,
						thumb: contentThumb
					});
				});
		
				stream.on('error', (streamErr) => res.end(streamErr));
				stream.on('end', () => { console.log('Stream terminou!') });
			} catch (error) {
				console.log('FOI AQUI!: ' + error);
			}
		} else {
			const choosed = await (() => {
				for (let video in mscs) {
					if (mscs[video].id == req.query.id) {
						return video;
					}
				}
			})();

			let file = mscs[choosed].title;

			let contentAutor = '';
			let contentThumb = '';
			let contentTitle = () => {
				try {
					for(let index in mscs) {
						if (mscs[index].title == file) {
							contentAutor = mscs[index].autor;
							contentThumb = mscs[index].thumb;
							return mscs[index].title.split('.')[0];
						}
					}
				} catch (error) {
					console.log("Erro: " + error);	
				}
			}

			let stream = youtubeStream('http://www.youtube.com/embed/' + (await function() {
				for (let video in mscs) {
					if (mscs[video].title == file) {
						return mscs[video].id;
					}
				}
			})());

			stream.pipe(res).on('finish', () => { console.log('O socket baixou a música!'); });
			let content = await contentTitle();

			res.writeHead(200, {
				'Content-Type': 'audio/mp3',
				// 'Content-Length': stat.size,
				// 'Content-Title': content,
				// 'Content-Author': contentAutor,
				// 'Content-Thumb': contentThumb
			});

			io = require('socket.io')(server);

			await io.on('connection', async socket => {
				socket.emit('load', {
					ans: true,
					titulo: content,
					autor: contentAutor,
					thumb: contentThumb
				});
			});

			stream.on('error', (streamErr) => res.end(streamErr));
			stream.on('end', () => { console.log('Stream terminou!') });
		}
    })

	return router;
}