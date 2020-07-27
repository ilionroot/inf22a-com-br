// $(window).ready(function() {
//     let request = $.ajax({
//         url: url,
//         method: "GET",
//         data: {},
//         crossDomain: true,
//         dataType: 'html',
//         beforeSend: function() {
//         }
//     });
// });

var playMusicDiv = document.querySelector('.music-card');
var player = document.querySelector('#player');
var addMusicDiv = document.querySelector('#add');
var playlistDiv = document.querySelector('#playlist');
var playMusicDiv = document.querySelector('.music-card');

var addMusicSpan = document.querySelector('[name=addMusic]');
var seePlaylist = document.querySelector('[name=seePlaylist]');

var c1 = 0;

addMusicSpan.addEventListener('click', async function() {
    if (c1 === 0) {
        playMusicDiv.style.animation = 'windowChange1 .75s linear';
        addMusicDiv.style.animation = 'windowChange2 .75s linear';
        playlistDiv.style.opacity = 0;
        addMusicDiv.style.opacity = 1;

        setTimeout(()=>{
            playMusicDiv.style.zIndex = 0;
            addMusicDiv.style.zIndex = 1;
            c1++;
        },500);
    } else {
        playMusicDiv.style.animation = 'windowChange2 .75s linear';
        addMusicDiv.style.animation = 'windowChange1 .75s linear';

        setTimeout(()=>{
            playMusicDiv.style.zIndex = 1;
            addMusicDiv.style.zIndex = 0;
            setTimeout(()=>{ addMusicDiv.style.opacity = 0; }, 250);
            c1--;
        },500);
    }
});

let c2 = 0;

seePlaylist.addEventListener('click', function() {
    if (c2 === 0) {
        playMusicDiv.style.animation = 'windowChange2 .75s linear';
        playlistDiv.style.animation = 'windowChange1 .75s linear';
        addMusicDiv.style.opacity = 0;
        playlistDiv.style.opacity = 1;

        setTimeout(()=>{
            playMusicDiv.style.zIndex = 0;
            playlistDiv.style.zIndex = 1;
            c2++;
        },500);
    } else {
        playMusicDiv.style.animation = 'windowChange1 .75s linear';
        playlistDiv.style.animation = 'windowChange2 .75s linear';

        setTimeout(()=>{
            playMusicDiv.style.zIndex = 1;
            playlistDiv.style.zIndex = 0;
            setTimeout(()=>{ playlistDiv.style.opacity = 0; }, 250);
            c2--;
        },500);
    }
});

// $(document).ready(()=>{
//     let i = 0;
    
//     let titulo = document.querySelector('#titulo');
//     let autor = document.querySelector('#autor');
//     let thumb = document.querySelector('.music-image');

//     if (i === 0) {
//         // player.src = mscs[i].file;
//         // titulo.innerText = mscs[i].title;
//         // autor.innerText = mscs[i].autor;
//         // $(thumb).css('background-image', 'url(' + mscs[i].thumb + ')');
//         // i++;
//     }

//     player.onended = function () {
//         // if (typeof mscs[i] != 'undefined') {
//         //     this.src = mscs[i].file;
//         //     titulo.innerText = mscs[i].title;
//         //     autor.innerText = mscs[i].autor;
//         //     $(thumb).css('background-image', 'url(' + mscs[i].thumb + ')');
//         //     this.autoplay = true;
//         //     i++;
//         // } else {
//         //     i = 0;
//         //     this.src = mscs[i].file;
//         //     titulo.innerText = mscs[i].title;
//         //     autor.innerText = mscs[i].autor;
//         //     $(thumb).css('background-image', 'url(' + mscs[i].thumb + ')');
//         //     this.autoplay = true;
//         // }
//     }//https://cors-anywhere.herokuapp.com/
// })