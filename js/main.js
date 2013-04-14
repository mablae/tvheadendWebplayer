$(function() {
  "use strict";
  // Create slidr instances
  $('.toggleLink').sidr({name: 'sidrLeft', side: 'left'});
  $('.toggleLinkEpg').sidr({name: 'epgHolder', side: 'right'});
});

$(function() {
  "use strict";
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);


  var channelTags = [];
  var channels = [];
  var epg = [];

  var tvheadendHost = 'http://192.168.1.50:9981';

  var currentTag = false;
  var currentChannel = null;
  var currentEpg = null;
  var socket = io.connect();

  var menuHolder = $('#menuHolder');
  var resizeDoIt; 

  /* SocketIO EventListeners */

 socket.on('statusUpdate', function(data) {
     console.log(data);

     if (data.msg) {
     humane.log(data.msg); 
     }
     
     if (data.cmd) {
      switch (data.cmd) {
        case "startPlayback":
          if (mainPlayer !== null && !isMobile) {
            mainPlayer.stop();
            setTimeout(
              function() { mainPlayer.play(); },
              8000
            );
          }
          break;
        case "stopPlayback":
          if (mainPlayer !== null && !isMobile) {
            mainPlayer.stop();
          }
          break;
        case "setCurrentChannel":
          if (data) {
            $('a.channelLink').parent().removeClass('active');
            $('a.channelLink[data-identifier="'+data.data.chid+'"]').parent().addClass('active');    
            $('#header h3').text(data.data.name);
            currentChannel = data.data;
            }
          break;
  

       // end if data.cmd   
      }
       
    }

 });
  var mainPlayer = $('#playerHolder');


  var viewCurrentEpg = function(chid) {
    loadEpg();
    currentEpg = [];
    if (chid && epg.entries) {
      for (var i = 0; i < epg.entries.length; i++) {
        if (epg.entries[i].channelid === chid) {
          currentEpg.push(epg.entries[i]); 
        }
      }
    }

    if (currentEpg) {
      var epgHolder = $('#epgHolder');
      epgHolder.html('<ul class="nav nav-pills nav-stacked"></ul>');
      for (var p = 0; p < currentEpg.length; p++) {
        epg = currentEpg[p];
        $('#epgHolder .nav').append('<li><h3>' + epg.title + '</h3><p>'+moment.unix(epg.end).fromNow() + '</p></li>'); 
      }
    }
  };

 
 
  var resizePlayerHolder = function() {
      $('#playerHolder').css({
        width: $(window).width()- 5,
        height: $(window).height() - 20    -70    
      });
    
      $('#sidebar').css({
        height: $(window).height() - 20
      });
      $('#navHolder').css({
        height: $(window).height() - 40
      });

      $(".nano").nanoScroller();
    };


    
  var viewChannelTags = function() {
    menuHolder.html('');
    for (var i = 0; i <= channelTags.length - 1; i++) {
      menuHolder.append('<li ><a class="navLink channelTagLink" href="#" data-identifier="'+channelTags[i].identifier+'"><img src="/img/folder.png">'+channelTags[i].name+'</a></li>');
    }
    $(".nano").nanoScroller();
  };


  var viewChannels = function(tagIdentifier) {
    menuHolder.html('');

    menuHolder.append('<li><a href="#" class="backLink" href="#"><strong>..</strong></a></li>');
    for (var i = 0; i < channels.length; i++) {
      var tags = channels[i].tags.split(',');
      for (var f = 0; f < tags.length; f++) {
        if (tags[f] === tagIdentifier) {
          menuHolder.append('<li><a class="navLink channelLink" href="#" data-name="'+channels[i].name+'"" data-identifier="'+channels[i].chid+'"><img src="/logos/'+channels[i].name.toLowerCase()+'.png">'+channels[i].name+'</a></li>');
          break;
        }
      }
    }
    $(".nano").nanoScroller();	
  }; 

  var loadChannelTags = function() {
    $.ajax({
        type: 'GET',
        url: '/channelTags',
        dataType: 'json',
        success: function(responseData, textStatus, jqXHR) 
        {
            localStorage.setItem('channelTags', JSON.stringify(responseData.entries));
            channelTags = responseData.entries;
            viewChannelTags();
        },
        error: function (responseData, textStatus, errorThrown) 
        {
            console.warn(responseData, textStatus, errorThrown);
        }
    });
  };

  var loadChannels = function() {
    $.ajax({
      type: 'GET',
      url: '/channels',
      dataType: 'json',
      success: function(responseData, textStatus, jqXHR) 
      {
        channels = responseData.entries;
      },
      error: function (responseData, textStatus, errorThrown) 
      {
        console.warn(responseData, textStatus, errorThrown);
          
      }
    });
  };

  var loadEpg = function() {
      $.ajax({
          type: 'GET',
          url: '/epg',
          dataType: 'json',
          success: function(responseData, textStatus, jqXHR) 
          {
              epg = responseData;
            

          },
          error: function (responseData, textStatus, errorThrown) 
          {
              console.warn(responseData, textStatus, errorThrown);
          }
      });
  };

  var init = function() {
    /* Register clicks */
    moment.lang('de');
    loadChannelTags();
    loadChannels();
    loadEpg();
    resizePlayerHolder();

    if (!isMobile) {
      mainPlayer = flowplayer("playerHolder", {src: "/flowplayer/flowplayer-3.2.16.swf", wmode: 'gpu'}, {
        clip: {
          url: 'tvheadend',
          live: true,
          scaling: 'fit',
          autoPlay: true,
          onBeforePause : function(){
              return false;
          },          
          // configure clip to use influxis as our provider, it uses our rtmp plugin
          provider: 'influxis'
      },

      // streaming plugins are configured under the plugins node
      plugins: {
          // Show no controls at all
          controls: null,       
          // here is our rtpm plugin configuration
          influxis: {
              url: "flowplayer.rtmp-3.2.12.swf",
               // netConnectionUrl defines where the streams are found
              netConnectionUrl: 'rtmp://192.168.1.50:1935/live'
          }
        }
      });
    } else {
        mainPlayer.html('<h1>Start external streaming app here</h1>');
      
           mainPlayer.append('<a href="http://192.168.1.50:4051/hls/tvheadend/index.m3u8" class="btn" >HLS Livestream</a>');
           mainPlayer.append('<a href="http://192.168.1.50:4051/tvheadend.flv" class="btn" >FLV progressive</a>');
           mainPlayer.append('<a href="rtmp://192.168.1.50:1935/play/tvheadend" class="btn" >RTMP live</a>');

    }
  };


  init();


  $(window).resize(function() {
     clearTimeout(resizeDoIt);
     resizeDoIt = setTimeout(resizePlayerHolder, 100);
  });


  $(document).on("click", "a.channelTagLink", function(e) {
    e.preventDefault();
    e.stopPropagation();
    var id = $(this).data('identifier');
    viewChannels(id);
  });

  $(document).on("click", "a.channelLink", function(e) {
    e.preventDefault();
    e.stopPropagation();
    socket.emit('switchToChannel', { id: $(this).data('identifier') });
    return false;
  });


  $(document).on("click", "a.backLink", function(e) {
    e.preventDefault();
    e.stopPropagation();
    viewChannelTags();
  });

  $(document).on("click", "a.toggleLink", function(e) {
    e.preventDefault();
    $.sidr('toggle', 'toggleLink');
     $(this).toggleClass('toggleLinkActive');
     
  });

  $(document).on("click", "a.toggleLinkEpg", function(e) {
    e.preventDefault();
    viewCurrentEpg(currentChannel.chid);
    $.sidr('toggle', 'epgHolder');
    $(this).toggleClass('toggleLinkActive');
  });


});