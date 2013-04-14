"use strict";
var express = require('express.io'),
    spawn = require('child_process').spawn,
    request = require('request'),
    crypto = require('crypto'),
    app = express();

app.http().io();

var globalConfig = {
   streamingMode : 'mist', //  mist || crtmp
   tvheadendHost : 'http://192.168.1.50:9981', // format: ip:port
   mistHost      : 'http://192.168.1.50:4242', // format: ip:port
   streamTranscoder : 'ffmpeg',  // 'ffmpeg' || 'avconv'
   streamResolution : '640x360' // format 'WxH'

};

var childPid = null;
var avconvProcess = null;
var streamingData = null;


var MistServer = function(){
  this.getStreamingDataFromMistServer = function(callback) {
    var cmdData = { 'authorize': {
                  username: 'admin',
                  password: crypto.createHash('md5').update(crypto.createHash('md5').update('fenster').digest('hex') + "sadsad").digest("hex")
                }};
    var cmd = globalConfig.mistHost + '/api?command=';
    request(cmd + encodeURIComponent(JSON.stringify(cmdData)), function(error, response, body) {
        var data = JSON.parse(body);
        var resultData = body;
        if (data.authorize.challenge) {
            var cmdData = { 'authorize': {
                  username: 'admin',
                  password: crypto.createHash('md5').update(crypto.createHash('md5').update('fenster').digest('hex') + data.authorize.challenge).digest("hex")
                }};
             
            request(cmd + encodeURIComponent(JSON.stringify(cmdData)), function(error, response, body) {
                if (!error) {
                    resultData = body;
                    callback(resultData);
                }
                
                });            
          } else { 
            callback(resultData);
          }
    });
  };
 };

var Tvheadend = function() {
  var channels = null;
  var channelTags = null;
  var currentChannel = null;
  var epg = null;
   
  this.getChannels = function(callback) {
    if (channels === null) {
      request(tvheadendHost + '/channels?op=list', function(error, response, body) {
        channels = body;
        callback(body);
        });
    }
    else {
      callback(channels);
    }
  };

  this.getChannelTags = function(callback) {
    if (channelTags === null) {
      request(tvheadendHost + '/channeltags?op=listTags', function(error, response, body) {
        channelTags = body;
        callback(body);
        });
    }
    else {
      callback(channelTags);
    }
  };

  this.getEpg = function(callback) {
    if (epg === null) {
      request(tvheadendHost + '/epg?limit=500&start=0', function(error, response, body) {
      callback(body);
      });
    }
    else {
      callback(epg);
    }
  };
  this.setCurrentChannel= function(channel, callback) {
    currentChannel = channel;
    app.io.broadcast('statusUpdate', { 'cmd': 'setCurrentChannel', 'data': channel });
    if (callback) {
      callback();
    }
    
  };

  this.getCurrentChannel= function() {
    return currentChannel;
  };
};


var mistServer = new MistServer();
var tvh = new Tvheadend();

var killWorker = function(callback) {
      try {
         if (childPid > 0) {
            console.log('Killing process with pid '+childPid);
            process.kill(avconvProcess.pid, 'SIGKILL');
            app.io.broadcast('statusUpdate', {'msg': globalConfig.streamTranscoder+'-Transcoder stopped..'});
         }

      } 
      catch (e) {

      }
      callback();
};

/* gracefully shutting down the Main Process */
process.on('SIGINT', function() {
  console.log( "\n...gracefully shutting down from  SIGINT (Crtl-C)" );
  // some other closing procedures go here
  process.kill(childPid,'SIGKILL');
  app.io.broadcast('statusUpdate', { 'msg' : 'Backend has been stopped.!' });
  process.exit();
});


/* Socket.IO Controlling */
app.io.sockets.on('connection', function (socket) {
  if (!tvh.getCurrentChannel == null) {
    socket.emit('statusUpdate', { 'connected': true, 'data': tvh.getCurrentChannel(), 'cmd': 'setCurrentChannel' });
  }
  else {
    socket.emit('statusUpdate', { 'connected': true, 'data': {}, 'msg': 'Connection established.'});
  }
});


/* Express controllers */
app.use(express.static(__dirname));

app.get('/channels', function(req, res) {
  tvh.getChannels(function(data){
      res.send(200, data);
  });
});


app.get('/channelTags', function(req, res) {
 tvh.getChannelTags(function(data){
      res.send(200, data);
  });
});

app.get('/epg', function(req, res) {
  tvh.getEpg(function(data){
      res.send(200, data);
  });
});

app.get('/', function(req, res) {
  res.sendfile( __dirname+ '/index.html');
});

app.get('/streamingData', function(req, res) {
  mistServer.getStreamingDataFromMistServer(function(data) {
    console.log(data);
    res.send(200, data);
  });
});

app.io.route('switchToChannel', function(req, res) {
  req.io.join(req.data);


  // Update current tuned channel
  tvh.getChannels(function(channels) {
    channels = JSON.parse(channels);
    for (var i = 0; i < channels.entries.length; i++) {
      if (channels.entries[i].chid == req.data.id) {
        tvh.setCurrentChannel(channels.entries[i]);
      }
    };
  });


  
  var pathToChannel =  globalConfig.tvheadendHost + '/stream/channelid/' +req.data.id, 
      cmd = globalConfig.streamTranscoder,
      args = 
    ['-i' , pathToChannel, 
    '-acodec', 'aac',
    '-strict',  'experimental',
    '-b:a', '128k',
    '-ar', '44100',
    '-async', '1',
    '-vcodec', 'libx264', 
    '-g', '2000', // Keyframe Max interval in ms
    '-filter:v', 'yadif',
    '-threads', '0', // auto multi-treading
    '-preset:v', 'veryfast', 
    '-profile:v', 'high', 
    '-crf', '22',
    //'-qp', '0',
    '-f', 'flv',
    '-s', globalConfig.streamResolution,
    '-r', '25',
    'rtmp://127.0.0.1:1935/live/tvheadend'
    ];

  killWorker(function() {
    
    // Spawn the new transcoding process on callback
    avconvProcess = spawn(cmd, args, { detached: true  });
    app.io.broadcast('statusUpdate', { 'msg': 'Playback starting...', 
                                       'cmd': 'startPlayback'
                                     });
    childPid = avconvProcess.pid;  

    /* Handle events from the transcoder process */
    avconvProcess.stderr.on('data', function (data) {     
      // collect data somehow
      console.log(globalConfig.streamTranscoder.': '+data);
    });

    avconvProcess.on('close', function (code, signal) {
      if (signal === null) {
        app.io.broadcast('statusUpdate', {
          'msg': globalConfig.streamTranscoder + '-Transcoder has crashed...',
          'cmd': 'stopPlayback'
        });
      }
    });
   /* END of killWorker callback   */
  });
});

app.listen(4000);
