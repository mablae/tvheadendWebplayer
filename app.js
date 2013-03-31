var express = require('express.io'),
    spawn = require('child_process').spawn,
    fs = require('fs');
    out = fs.openSync('./out.log', 'a'),
    err = fs.openSync('./out.log', 'a');

var app = express();
app.http().io();

var tvheadendHost = 'http://192.168.1.50:9981';
var childPid = null;

var killWorker = function(callback) {
      try {
         if (childPid > 0) {
            console.log('Killing process with pid '+childPid);
            process.kill(childPid, 'SIGKILL');
            app.io.broadcast('statusUpdate', {'msg': 'Stream gestoppt.'});
         }

      } 
      catch (e) {
        console.log('The process was killed before...');
        app.io.broadcast('statusUpdate', {'msg': 'Stream ist abgestürzt.'});
      }
      callback();
};

process.on( 'SIGINT', function() {
  console.log( "\n...gracefully shutting down from  SIGINT (Crtl-C)" )
  // some other closing procedures go here
  process.kill(childPid,'SIGKILL');
  app.io.broadcast('statusUpdate', { 'msg' : 'Node.js Backend wurde beendet!' });
  process.exit( )
})



/* Socket.IO Controlling */

app.io.sockets.on('connection', function (socket) {
  socket.emit('say-hello', { 'connected': true });
});




/* Express controllers */
app.use(express.static(__dirname));


app.get('/', function(req, res) {
  res.sendfile( __dirname+ '/index.html');
});

app.io.route('switchToChannel', function(req) {
  req.io.join(req.data);


  // make sure you set the correct path to your video file storage
  var pathToMovie =  tvheadendHost + '/stream/channelid/' +req.data.id; 
  var cmd = 'avconv';
  var args = 
   ['-re', '-i' , pathToMovie, 
    '-acodec', 'libmp3lame',
    '-b:a', '128k',
    '-ar', '44100',
    '-vcodec', 'libx264',
    '-filter:v', 'yadif',
    '-threads', '4',
    //'-preset', 'veryslow',
    '-profile:v', 'baseline', 
    '-b:v', '5000k',
    '-f', 'flv',
    '-s', '964x544',
    '-metadata', 'streamName=myStreamName',
    'tcp://127.0.0.1:6666'];




  killWorker(function() {
  
  console.log('Starting stream for: '+ pathToMovie);
  console.log('Command is: '+ cmd + args.join(' '));
  child = spawn(cmd, args, {
     detached: true,
     stdio: [ 'ignore', out, err ]
     });

   console.log('Spawned child pid: ' + child.pid);
   var response = {
                   'msg' : 'Wiedergabe wird gestartet...', 
                   'startPlayback': true
                  };

   childPid = child.pid;  

   req.io.emit('statusUpdate', response);
  });

});


app.listen(4000);
