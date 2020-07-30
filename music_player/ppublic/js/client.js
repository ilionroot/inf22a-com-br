$(document).ready(async () => {
	try {
		var socket = io('/');
	
		socket.on('load', async infos => {
			if (infos.ans) {
				$('#titulo').text(infos.titulo);
				$('#autor').text(infos.autor);
				$('.load').css('display', 'none');
				$('.music-image').css('background-image', 'url(' + infos.thumb + ')');
			}
		});
	
		socket.on('next', async infos => {
			if (infos.ans) {
				$('#titulo').text(infos.titulo);
				$('#autor').text(infos.autor);
				$('.load').css('display', 'none');
				$('.music-image').css('background-image', 'url(' + infos.thumb + ')');
			}
		})
	
		document.getElementById('player').onended = async function () {
			socket.close();
			socket.open();
			document.getElementById('player').src = '/player/audio';
			
			// this.src = '/audio';
	
			// if (typeof mscs[i] != 'undefined') {
			// 		this.src = mscs[i].file;
			// 		$('#titulo').text(mscs[i].title);
			// 		$('#autor').text(mscs[i].autor);
			// 		$('.music-image').css('background-image', 'url(' + mscs[i].thumb + ')');
			// 		this.autoplay = true;
			// 		i++;
			// } else {
			// 		i = 0;
			// 		this.src = mscs[i].file;
			// 		titulo.innerText = mscs[i].title;
			// 		autor.innerText = mscs[i].autor;
			// 		$(thumb).css('background-image', 'url(' + mscs[i].thumb + ')');
			// 		this.autoplay = true;
			// }
		}//https://cors-anywhere.herokuapp.com/
	} catch (err) {
		console.log(err);
	}

	$('.song').click(function() {
		socket.close();
		socket.open();
		document.getElementById('player').src = '/player/audio?id=' + this.id;
	});
});