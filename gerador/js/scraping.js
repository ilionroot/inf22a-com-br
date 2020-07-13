function getRandom(max) {
    return Math.floor(Math.random() * max + 1)
}

function scraping(url) {
    // var myHeaders = new Headers();

    // var myInit = {
    //     method: 'GET',
    //     headers: myHeaders,
    //     mode: 'no-cors',
    //     cache: 'default'
    // };

    // var myRequest = new Request(url, myInit);

    // fetch(myRequest)
    // .then(function(response) {
    //     return response.text();
    // })
    // .then(function(myhtml) {
    //     var objectURL = document.createElement('img');
    //     objectURL.src = myhtml;
    //     document.body.appendChild(objectURL);

    //     console.log(myhtml)
    // });

    // var xhttp = new XMLHttpRequest();
    // xhttp.onreadystatechange = function() {
    //     if (this.readyState == 4 && this.status == 200) {
    //         var plantas = xhttp.re;
    //         console.log(plantas);
    //         console.log(plantas.getElementsByClassName('pt-cv-thumbnail img-rounded no-lazyload cvplazy'));
    //     } else {
    //         console.log("error");
    //     }
    // };

    // xhttp.open("GET", 'https://cors-anywhere.herokuapp.com/' + url);
    // xhttp.send();

    let request = $.ajax({
        url: url,
        method: "GET",
        data: {},
        crossDomain: true,
        dataType: 'html',
        beforeSend: function() {
            console.log("Before sent!");
            document.body.innerHTML += "Loading...!<br>";
        }
    });

    request.done(async data=>{
        var banana = await $(data).find('a._self.pt-cv-href-thumbnail.pt-cv-thumb-default.cvplbd');
        var list = [];

        for(let a = 0; a < 15; a++) {
            var index = getRandom(854);
            list.push(banana[index]);
        }

        $(list).each((i, e) => {
            var obj = document.createElement('div');
            obj.setAttribute('class', 'planta');
            obj.innerHTML = '<h2>' + $(e).find('img')[0].alt + '</h2>' + '<br>';

            let infs = $.ajax({
                url: 'http://cors-anywhere.herokuapp.com/' + e.href,
                method: "GET",
                data: {},
                crossDomain: true,
                dataType: 'html',
                beforeSend: function() {
                }
            });

            infs.done(async infos=>{
                await $(infos).find('div#custom_type_fields ul li').each((i, el)=>{
                    obj.innerHTML += el.innerText + "<br>";
                });

                document.body.appendChild(obj);
            });
        });

        $('#salvar').click((e)=>{
            var doc = new jsPDF();
            var elementHandler = {
                '#ignorePDF': function (element, renderer) {
                  return true;
                }
              };
            // doc.html(document.body, {
            //     callback: (result)=>{
            //         result.save();
            //     }
            // });

            var source = window.document.getElementsByTagName("body")[0];
            doc.fromHTML(
                source,
                15,
                15,
                {
                'width': 180,'elementHandlers': elementHandler
                });

            doc.output("dataurlnewwindow");

            // doc.fromHTML(document.body, 10, 10);
            // doc.save();
        });
    });
}

scraping('http://cors-anywhere.herokuapp.com/https://www.jardineiro.net/plantas-de-a-a-z-por-nome-popular');