var express = require('express'),
    spawn = require('child_process').spawn,

    fs = require('fs');
    out = fs.openSync('./out.log', 'a'),
    err = fs.openSync('./out.log', 'a');

var app = express();
var tvheadendHost = 'http://192.168.1.50:9981';
var child = null;
var workers = new Array();


var killWorker= function() {
      for (var i = 0; i < workers.length; i++) {
        if (workers[i] != null) {
          console.log('Killling worker: ' + workers[i].pid +'\n');
          try {
            process.kill(workers[i].pid, 'SIGKILL');
          }
          catch (e) {
            console.log(e);
          }       
          workers[i] = null;
          }
      }
};

process.on( 'SIGINT', function() {
  console.log( "\ngracefully shutting down from  SIGINT (Crtl-C)" )
  // some other closing procedures go here
  killWorker();
  process.exit( )
})

app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.send('index.html');
});

app.get('/channel/:id', function(req, res) {
  ;
  // make sure you set the correct path to your video file storage
  var pathToMovie =  tvheadendHost + '/stream/channelid/' +req.params.id; 
  var cmd = 'avconv';
  var args = 
   ['-i' , pathToMovie, 
    '-acodec', 'aac',
    '-strict', 'experimental',
    '-b:a', '128k',
    '-ar', '44100',
    '-vcodec', 'libx264',
    '-filter:v', 'yadif',
    '-threads', '4',
    '-preset', 'veryfast',
    '-b:v', '2000k',
    '-f', 'flv',
   '-s', '768x432',
   '-metadata', 'streamName=myStreamName',
   'tcp://127.0.0.1:6666'];
  killWorker();

  console.log('Starting stream for: '+ pathToMovie);
  console.log('Command is: '+ cmd);
  child = spawn(cmd, args, {
     detached: true,
     stdio: [ 'ignore', out, err ]
     } );

  console.log('Spawned child pid: ' + child.pid);
  workers.push(child);

  child.on('exit', function() {
    console.log('avconv stopped\n - deleting process '+child.pid+' from list...');
    
    });    

  var response = {'streamStarted': true};

  res.json(200, response);
});

app.listen(4000);


