var express = require('express'),
    ffmpeg = require('fluent-ffmpeg');
    fs = require('fs');

var app = express();
var tvheadendHost = 'http://192.168.1.50:9981';

var stream = fs.createWriteStream(__dirname+'/stream.flv');
app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.send('index.html');
});

app.get('/channel/:id', function(req, res) {
  //res.contentType('flv');
  // make sure you set the correct path to your video file storage
  var pathToMovie =  tvheadendHost + '/stream/channelid/' +req.params.id; 
  console.log('Starting stream for: '+ pathToMovie);
  var proc = new ffmpeg({ source: pathToMovie, nolog: true })
    // use the 'flashvideo' preset (located in /lib/presets/flashvideo.js)
    .toFormat('flv')
    // save to stream
    .writeToStream(res, function(retcode, error){
      console.log('file has been converted succesfully');
    });

});

app.listen(4000);
