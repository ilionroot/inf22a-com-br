var socket = io('/');

var chat = 0;
var ademe = '';

function renderMessage(message) {
    $('.messages').append('<div class="message"><strong>' + message.autor + '</strong>: ' + message.message + '</div>');
}

function scroll(tempo) {
    $(".messages").stop().animate({ scrollTop: $(".messages")[0].scrollHeight}, tempo);
}

socket.on('lastMessages', lasts=>{
    lasts.forEach(element => {
        renderMessage(element); 
    });

    scroll(1000);
});

socket.on('receivePublicMessage', msg=>{
    renderMessage(msg);
    scroll(1000);
});

socket.on('receivePrivateMessage', msg=>{
    renderMessage(msg);
    scroll(1000);
})

$('#send').submit((e)=>{
    e.preventDefault();
    var autor = document.getElementById('user').innerText;
    var message = $('input[name=message]').val();

    if (autor != "" && message != "") {
        if (chat == 0) {
            var msg = {
                autor,
                message: $('#msg').val()
            }
        
            socket.emit('public', msg);
            renderMessage(msg);
    
            $('input[name=message]').val("");
    
            scroll(250);
        } else if (chat == 1){
            var msg = {
                autor,
                message: $('#msg').val()
            }
        
            socket.emit('private', {
                msg,
                ademe
            });
            renderMessage(msg);
    
            $('input[name=message]').val("");
    
            scroll(250);
        }
    } else {
        if (autor == "") {
            alert('Vocẽ não possui um apelido de entrada!');
        }
    }
});

var click1 = 0;

function drop(p) {
    if(click1 === 0) {   
        $('.divMid').css('height', '100vh');
        $(p).css('color', 'grey');
        $('.divMid').css('font-size', '20px');

        click1++;
    } else {
        $('.divMid').css('height', '0');
        $(p).css('color', 'black');
        $('.divMid').css('font-size', '0');

        click1 = 0;
    }
}

function recoy() {
    $('.divMid').css('height', '0');
    $('.divMid').css('font-size', '0');

    click1 = 0;
}

function publico() {
    var autor = document.getElementById('user').innerText;

    socket.emit('publicRoom', {
        autor
    });

    chat = 0;
}

function privado(adm) {
    var autor = document.getElementById('user').innerText;

    socket.emit('privateRoom', {
        autor,
        adm: adm.innerText
    })

    chat = 1;
    ademe = adm.innerText;
    recoy(adm);
}