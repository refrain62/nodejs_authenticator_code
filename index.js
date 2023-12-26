var speakeasy = require('speakeasy');
var QRcode = require('qrcode');

// シークレットキーの発行
var secret = speakeasy.generateSecret({ 
  length: 20,
  name: 'example.com',
  issuer: 'example test'
});

console.log( secret.base32 );
// NFHWERRRFQUVIRCFFBZXUUTDINWEUXJY

// QRコードを生成
const url = speakeasy.otpauthURL({
  secret: secret.ascii,
  label: encodeURIComponent('example.com'),
  issuer: 'example test'
});

var qrcode64;

QRcode.toDataURL( url, (err, qrcode) => {
  // base64のQRコードの画像パスが入ってくる
  // HTMLで返す
  qrcode64 = qrcode;
//  console.log( qrcode );
});

// レスポンスで返す
const http = require('http');
const fs = require('fs');

var server = http.createServer( (req, res)=>{
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  console.log(req.url);
  // リクエストごとに表示内容を切り分け
  switch (req.url) {
      // 認証
      case '/auth':
        if (req.method === 'POST') {
          var authCode = '';

          // POST内容を処理
          req.on('data', function(chunk) {
            authCode = chunk;
          }).on('end', function() {
            console.log('POSTされたコード：' + authCode);
            console.log('シークレットキー：' + secret.base32);
            
            const verified = speakeasy.totp.verify({
              secret: secret.base32,
              encoding: 'base32',
              token: authCode
            });
    
            console.log('認証結果：');
            console.log(verified);
            res.write('<p>認証結果:' + (verified ? '成功' : '失敗') + '</p>');
          })
        }
        
        break;

      // 通常
      default:
        res.write(`
          <h1>二要素認証用画像</h1>
          <br />
          <img src="${qrcode64}" />
          <br />
          <form action="http://localhost:3000/auth" method="POST">
            <input type="input" name="authCode">
            <input type="submit" value="認証コード送信" /> 
          </form>
          `);

          break;
  }
  
  
  res.end();
});

// サーバーのリスナー起動
server.listen(3000);