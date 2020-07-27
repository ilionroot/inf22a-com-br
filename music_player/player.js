module.exports = (server) => {
	const express = require('express');
	const router = express.Router();

	const exphbs = require('express-handlebars');
	const bodyParser = require('body-parser');
	const path = require('path');
	const Youtube = require('simple-youtube-api');
	const youtube = new Youtube(require('./configs/configs').googleAPI);
	const jsonFile = require('jsonfile');
	const fs = require('fs');
	const getStat = require('util').promisify(fs.stat);
	let io = require('socket.io')(server);
	const youtubeStream = require('youtube-audio-stream');

	router.use(bodyParser.urlencoded({ extended: true }));
	router.use(bodyParser.json());

    router.use(express.static(path.join(__dirname, 'ppublic')));

	let mscs;

	const middle = async (req, res, next) => {
		try {
			mscs = await jsonFile.readFileSync('./music_player/playlist.json');
			next();
		} catch (error) {
			next();
		}
	};

	router.get('/', middle, async (req, res) => {
		if (mscs) {
			if (mscs.mscs.length === 0) { return res.render('pages/hp'); }
			res.render('pages/player', {
                layout: 'mp',
				musica: mscs.mscs
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
		let { pesquisa } = req.body;
		console.log(pesquisa);

		await youtube.searchVideos(pesquisa, 1).then(async video => {
			await fs.exists('./music_player/playlist.json', async exists => {
				if (!exists) {
					try {
						console.log('Adicionando...');
						await jsonFile.writeFile('./music_player/playlist.json', {
							mscs: [
								{
									"id": video[0].id,
									"title": video[0].title + '.mp3',
									"autor": video[0].raw.snippet.channelTitle,
									"thumb": video[0].thumbnails.high.url,
								}
							]
						}, (err, escrito) => {
							res.render('pages/player', {layout: 'mp'});
						});
					} catch (error) {
						console.log('FOI AQUI!: ' + error);
					}
				} else {
					console.log('Adicionando...');
					console.log('Música ' + video[0].title + ' adicionada à biblioteca!');
						let musicas = await jsonFile.readFileSync('./music_player/playlist.json');
						musicas.mscs.push({
							"id": video[0].id,
							"title": video[0].title + '.mp3',
							"autor": video[0].raw.snippet.channelTitle,
							"thumb": video[0].thumbnails.high.url,
						});
						await jsonFile.writeFile('./music_player/playlist.json', musicas);
						res.render('pages/player', {layout: 'mp'});
				}
			});
		}).catch(err => {
			console.log('Erro personalizado: ' + err);
			res.status(404);
		})
	});

	router.get('/audio', async (req, res) => {
		if (mscs == undefined) {
			mscs = await jsonFile.readFileSync('./music_player/playlist.json');
		}

		if (!req.query.id) {
			try {
				let index = Math.floor(Math.random() * mscs.mscs.length);
				let file = mscs.mscs[index].title;
		
				// await fs.createReadStream(filePath);
		
				let contentAutor = '';
				let contentThumb = '';
				let contentTitle = () => {
					try {
						for(let index in mscs.mscs) {
							if (mscs.mscs[index].title == file) {
								contentAutor = mscs.mscs[index].autor;
								contentThumb = mscs.mscs[index].thumb;
								return mscs.mscs[index].title.split('.')[0];
							}
						}
					} catch (error) {
						console.log("Erro: " + error);	
					}
				}
		
				let stream = youtubeStream('http://www.youtube.com/embed/' + (await function() {
					for (let video in mscs.mscs) {
						if (mscs.mscs[video].title == file) {
							return mscs.mscs[video].id;
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
				for (let video in mscs.mscs) {
					if (mscs.mscs[video].id == req.query.id) {
						return video;
					}
				}
			})();

			let file = mscs.mscs[choosed].title;

			let contentAutor = '';
			let contentThumb = '';
			let contentTitle = () => {
				try {
					for(let index in mscs.mscs) {
						if (mscs.mscs[index].title == file) {
							contentAutor = mscs.mscs[index].autor;
							contentThumb = mscs.mscs[index].thumb;
							return mscs.mscs[index].title.split('.')[0];
						}
					}
				} catch (error) {
					console.log("Erro: " + error);	
				}
			}

			let stream = youtubeStream('http://www.youtube.com/embed/' + (await function() {
				for (let video in mscs.mscs) {
					if (mscs.mscs[video].title == file) {
						return mscs.mscs[video].id;
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