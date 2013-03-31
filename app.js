var express = require('express.io'),
    spawn = require('child_process').spawn,
    fs = require('fs');
    out = fs.openSync('./out.log', 'a'),
    err = fs.openSync('./out.log', 'a');

var app = express();
app.http().io();

var tvheadendHost = 'http://192.168.1.50:9981';
var child = null;
var workers = new Array();


var killWorker= function() {
      for (var i = 0; i < workers.length; i++) {
        if (workers[i] != null) {
          console.log('will now try to kill worker: ' + workers[i].pid +'\n');
          try {
            process.kill(workers[i].pid, 'SIGKILL');
          }
          catch (e) {
            console.log('The process was already gone...');
            
          }       
          workers[i] = null;
          }
      }
};

process.on( 'SIGINT', function() {
  console.log( "\n...gracefully shutting down from  SIGINT (Crtl-C)" )
  // some other closing procedures go here
  killWorker();
  app.io.broadcast('statusUpdate', { 'msg' : 'Node.js Backend wurde beendet!' });
  process.exit( )
})



/* Socket.IO Controlling */

app.io.sockets.on('connection', function (socket) {
  socket.emit('say-hello', { connected: 'true' });
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
   ['-i' , pathToMovie, 
    '-acodec', 'aac',
    '-strict', 'experimental',
    '-b:a', '128k',
    '-ar', '44100',
    '-vcodec', 'libx264',
    '-filter:v', 'yadif',
    '-threads', '4',
    //'-preset', '',
    '-profile:v', 'baseline', 
    '-b:v', '3000k',
    '-f', 'flv',
    '-s', '964x544',
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
    req.io.emit('statusUpdate', { 'msg' : 'AvConv wurde beendet...' });
    });    

  var response = {'msg' : 'Wiedergabe wird gestartet...'};
  

  req.io.emit('statusUpdate', response);


});


app.listen(4000);
