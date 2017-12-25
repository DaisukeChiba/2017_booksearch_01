// 指定したファイルから画像を読み込み、Base64形式にエンコード
function getFile(imgfile) {
    // 画面表示領域のクリア
    document.getElementById('imagearea').innerHTML = '';
    document.getElementById('base64area').innerHTML = '';
    document.getElementById('textarea').innerHTML = '';
    document.getElementById('bookarea').innerHTML = '';
    // 指定したファイルが無効のとき、処理を中断
    if(!imgfile.files.length) return;
    // 取得したファイル名から画像を取得
    var file = imgfile.files[0];
    var fr = new FileReader();
    fr.onload = function(evt){
        // 取得した画像を画面に表示
        document.getElementById('imagearea').innerHTML =
        '<img src="' + evt.target.result + '" width="100">';
        // Base64形式にエンコードした値を画面に表示
        document.getElementById('base64area').innerHTML = evt.target.result;
        // Base64形式データから先頭のファイル情報を削除(空文字に置換)
        var base64 = evt.target.result.replace(/^data:image\/(png|jpeg);base64,/, '');
        // Cloud Vision APIの呼び出し
        sendVisionAPI(base64);
    }
    fr.readAsDataURL(file);
}

// 画像からCloud Vision APIを使用してテキスト解析結果を取得
function sendVisionAPI(base64string){
    // リクエストパラメータの生成
    var body = {
        requests: [
            {image: {content: base64string}, features: [{type: 'TEXT_DETECTION'}]}
        ]
    };
    // XHRによるCloud Vision APIの呼び出し
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if((req.readyState == 4) && (req.status == 200)){
            console.log('--- Cloud Vision API ---');
            console.log(req.responseText);
            var res = JSON.parse(req.responseText);
            // 画像全体のテキスト解析結果を画面に表示
            document.getElementById('textarea').innerHTML =
            res.responses[0].textAnnotations[0].description;
            // Google Books APIの呼び出し
            sendBooksAPI(res.responses[0].textAnnotations[0].description);
        }
        if(req.status >= 400){
            document.getElementById('textarea').innerHTML = '取得エラー';
        }
    }
    req.open('POST', 'https://vision.googleapis.com/v1/images:annotate?key=APIキーを設定', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
}

// 検出したテキストからGoogle Books APIで書籍情報を取得
function sendBooksAPI(bookstring){
    // XHRによるGoogle Books APIの呼び出し
    var req = new XMLHttpRequest();
    req.onreadystatechange = function(){
        if((req.readyState == 4) && (req.status == 200)){
            console.log('--- Google Books API ---');
            console.log(req.responseText);
            var res = JSON.parse(req.responseText);
            // 最初に検出された書籍情報を画面に表示
            document.getElementById('bookarea').innerHTML =
            '名称 : ' + res.items[0].volumeInfo.title + '<br />' +
            '説明 : ' + res.items[0].volumeInfo.description;
        }
        if(req.status >= 400){
            document.getElementById('bookarea').innerHTML = '取得エラー';
        }
    }
    req.open('GET', 'https://www.googleapis.com/books/v1/volumes?q=' + bookstring, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send();
}
