function compare(text, result) {
    var length = text.length;

    var porc = 100 / result.length;

    var total = 0;

    var letters = [0];

    for (char in text) {
        for (l in result) {
            if (text[char] == result[l]) {
                if(function(){
                    letters.map((value,index,array)=>{
                        if (!array[index] == text[char]) {
                            letters.push(text[char]);
                            total += porc;
                        }
                    })
                }) {
                    //ue bro
                }
            }
        }
    }

    total = total;

    console.log(total);
}

compare('banana','feijao');