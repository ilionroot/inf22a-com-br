function anim(obj) {
    obj.classList.toggle('efeito');

    abrirLat();
}

function abrirLat() {
    var lat = document.querySelector('.lat');
    lat.classList.toggle('crescer');
}

var c = 0;
    
    function hide() {
        var lat = document.querySelector('#lat');
        var icon = document.querySelector('#hide');
        var list = document.querySelector('#thg');
        var options = document.querySelector('#nav');
        var cards = $('.card');

        if (c==0) {
            lat.style.width = '5%';

            icon.style.transition = '.5s ease-in-out';
            icon.style.marginTop = '25px';
            icon.style.marginLeft = '15%';
            icon.style.transform = 'rotate(-180deg)';

            list.style.width = '80%';
            list.style.left = '10%';

            options.style.opacity = 0;

            cards.each((i,e)=>{
                $(e).css('margin-left','6px');
                $(e).css('margin-right','23px');
            });

            c++;
        } else {
            lat.style.width = '30%';

            icon.style.marginTop = '10%';
            icon.style.marginLeft = '70%';
            icon.style.transform = 'rotate(-360deg)';

            setTimeout(()=>{
                icon.style.transition = '.1s ease-in-out';
            },500);

            list.style.width = '70%';
            list.style.left = '30%';

            options.style.opacity = 1;

            cards.each((i,e)=>{
                $(e).css('margin','35.8px');
            });

            c = 0;
        }
    }
    
    var click = 0;
    
    function abrir() {
        var ul = document.getElementById('it');
        var dropDown = document.getElementById('dropDown');

        if (click == 0) {
            ul.style.height = '60px';
            ul.style.opacity = 1;

            dropDown.style.transform = 'rotate(-180deg)';

            click++;
        } else {
            ul.style.height = '0';
            ul.style.opacity = 0;

            dropDown.style.transform = 'rotate(0deg)';

            click--;
        }
    }

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