var socket = io('/');

socket.emit('message', {
    message: 'conectou!'
});