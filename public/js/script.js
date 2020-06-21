function anim(obj) {
    obj.classList.toggle('efeito');

    abrirLat();
}

function abrirLat() {
    var lat = document.querySelector('.lat');
    lat.classList.toggle('crescer');
}