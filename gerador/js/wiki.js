$('.form-box').submit((e)=>{
    e.preventDefault();

    let wiki = $.ajax({
        url: 'https://pt.wikipedia.org/wiki/' + $('#search').val(),
        method: "GET",
        data: {},
        crossDomain: true,
        dataType: 'html',
        beforeSend: () => {
            console.log('Pesquisando...');
        }
    });

    wiki.done(async infos=>{
        console.log('Achei');

        let _infotable = await ($(infos).find('table.infobox_v2')[0]);

        if (typeof _infotable === "undefined" || _infotable.length == 0) {
            _infotable = await ($(infos).find('div.infobox_v2')[0]);
            console.log('teste1');
        }

        if (typeof _infotable === "undefined" || _infotable.length == 0) {
            _infotable = await ($(infos).find('table.vertical-navbox.nowraplinks')[0]);
            console.log('teste2');
        }

        if (typeof _infotable === "undefined" || _infotable.length == 0) {
            _infotable = await ($(infos).find('div.thumbinner')[0]);
            console.log('teste3');
        }

        $('.content').html(_infotable.innerHTML);
        _infotable = '';
    });
});