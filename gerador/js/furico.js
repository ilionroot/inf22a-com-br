function handleError() 
{ 
return true; 
} 
 
window.onerror = handleError; 

function furico(url) {
    let partidos = [
        'Progressistas',
        'Partido_Democrático_Trabalhista',
        'Partido dos trabalhadores',
        'Partido trabalhista brasileiro',
        'Movimento_Democrático_Brasileiro_(1980)',
        'Partido Comunista Brasileiro',
        'Partido_Liberal_(2006)',
        'Partido popular socialista',
        'Democratas_(Brasil)',
        'Partido Socialista Brasileiro',
        'Partido_Verde_(Brasil)',
        'Partido da Social Democracia Brasileira',
        'Partido socialismo e liberdade',
        'Partido comunista do brasil'
    ];

    $(partidos).each((i,e) => {
        let request = $.ajax({
            url: 'https://cors-anywhere.herokuapp.com/' + url + e.replace(' ', '_'),
            method: "GET",
            data: {},
            crossDomain: true,
            dataType: 'html',
            beforeSend: function() {
            }
        });

        request.done(async data => {
            let infs = $(data).find('table.infobox_v2');
            let parags = $(data).find('div.mw-parser-output')[0].innerHTML;

            let paragsDiv = document.createElement('div');
            $(paragsDiv).html(parags);
            $(paragsDiv).css('width', '50%');
            $(paragsDiv).css('height', '450px');
            $(paragsDiv).css('overflow', 'auto');
            
            let div = document.createElement('div');
            $(div).html(infs);
            $(div).css('display', 'flex');
            $(div).css('flex-direction', 'row');
            $(div).css('justify-content', 'center');
            $(div).css('align-items', 'center');
            $(div).css('margin','0 auto');
            $(div).css('width', '100%');
            $(div).css('height', 'auto');
            $(div).css('margin', '100px');

            if (!infs) {
                console.log(e);
            }

            $(div).append(paragsDiv);
            $(document.body).append(div);
        });
    });
}

furico('https://pt.wikipedia.org/wiki/');