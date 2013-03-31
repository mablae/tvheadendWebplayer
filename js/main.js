/*

author: malte blaettermann
twitter: @mablae

*/


$(function() {

    $('#sidebar').css({
        height: $(document).height()-50
	});
    var channelTags = [];
    var channelTagsLoaded = false;
    var channels = [];
    var channelsLoaded = false;
    var tvheadendHost = 'http://192.168.1.50:9981';
    var currentTag = false;
    var menuHolder = $('#menuHolder');
    var socket = io.connect();
    var resizeDoIt; 

    /* SocketIO EventListeners */

    socket.on('say-hello', function (data) {
        console.log(data);
        if (data.connected) {
            humane.log("WebSockets Verbindung hergestellt!");
        }
    }); 

    socket.on('error', function(errObj) {
       console.log(errObj);

   });

   socket.on('statusUpdate', function(data) {
       console.log(data);
       if (data) {
           humane.log(data.msg);
           mainPlayer.play();
       }
   });

   var mainPlayer = flowplayer("playerHolder", "/flowplayer/flowplayer-3.2.16.swf", {
      clip: {
        url: 'myStreamName',
        live: true,
        scaling: 'fit',
        autoPlay: false,
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
            netConnectionUrl: 'rtmp://192.168.1.50/flvplayback'
        }
      }
    });

  
   var resizePlayerHolder = function() {
     $('#playerHolder').css({
        width: $(window).width()- 5,
        height: $(window).height() - 20
        
        
      });
    };


    resizePlayerHolder();


    $(".nano").nanoScroller();

    var parseChannels = function(data) {
    	channelsLoaded = true;
    	channels = data;
    	
    };


    var viewChannelTags = function() {
    	
	menuHolder.html('');
    	for (var i = 0; i <= channelTags.length - 1; i++) {
    		menuHolder.append('<li ><a class="channelTagLink" href="#" data-identifier="'+channelTags[i].identifier+'">'+channelTags[i].name+'</a></li>');
    	};
    	$(".nano").nanoScroller();
    	
    }


	var viewChannels = function(tagIdentifier) {
		menuHolder.html('');
                menuHolder.append('<li><a href="#" class="backLink" ><strong>..</strong></a></li>');
		for (var i = 0; i < channels.length; i++) {
			tags = channels[i].tags.split(',');
			for (var f = 0; f < tags.length; f++) {
				if (tags[f] == tagIdentifier) {
                                
				
    				menuHolder.append('<li><a class="channelLink" href="#" data-name="'+channels[i].name+'"" data-identifier="'+channels[i].chid+'"><img src="/logos/'+channels[i].name.toLowerCase()+'.png">'+channels[i].name+'</a></li>');
    				break;
    			}

			};
				
    	       }
    	       $(".nano").nanoScroller();	
	}; 

    var loadChannelTags = function() {
    	// localStorage.clear();
    	if (localStorage.getItem('channelTags')==null) {

			$.ajax({
			    type: 'POST',
			    url: tvheadendHost+'/channeltags',
			    crossDomain: true,
			    data: "op=listTags",
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
		}
		else {
			channelTags = JSON.parse(localStorage.getItem('channelTags'));
			viewChannelTags();
		}
    };

    var loadChannels = function() {
    	if (localStorage.getItem('channels')==null) {
			$.ajax({
			    type: 'POST',
			    url: tvheadendHost+'/channels',
			    crossDomain: true,
			    data: "op=list",
			    dataType: 'json',
			    success: function(responseData, textStatus, jqXHR) 
			    {
			    	localStorage.setItem('channels', JSON.stringify(responseData.entries));
			        parseChannels(responseData.entries);
			    },
			    error: function (responseData, textStatus, errorThrown) 
			    {
			        console.warn(responseData, textStatus, errorThrown);
			        
			    }
			});

		}
		else {
			channels = JSON.parse(localStorage.getItem('channels'));
			
		}
	};

	var createStreamWindow = function(name, identifier) {
		var tmpl = [
			    // tabindex is required for focus
			    '<div class="modal hide fade" tabindex="-1">',
			      '<div class="modal-header">',
			        '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
			        '<h3>Kanal anspielen</h3>', 
			      '</div>',
			      '<div class="modal-body">',
			        '<p>Test</p>',
			      '</div>',
			      '<div class="modal-footer">',
			        '<a href="#" data-dismiss="modal" class="btn">Abbrechen</a>',
			      '</div>',
			    '</div>'
			  ].join('');

		var channelDialog = $(tmpl).modal();
		channelDialog.find('.modal-body').html(['<p>Externer Player oder im Browser starten?<p>' ,
			'<div class="btn-group">' ,
				'<a href="'+tvheadendHost+'/playlist/channelid/' +identifier+'.m3u" title="m3u Playlist" class="btn"><i class="icon-play"> </i> m3u Playlist</a>',
				'<a href="'+tvheadendHost+'/stream/channelid/' +identifier+'" title="m3u Playlist" data-identifier="'+identifier+'" class="btn channelLinkStream"><i class="icon-play"> </i> Stream starten</a>',
			'</div>'
			].join(''))
		channelDialog.modal();	  
		
		
	};


    var init = function() {
    	/* Register clicks */

    	loadChannelTags();
    	loadChannels();
    	

    };

    $(window).resize(function() {
       clearTimeout(resizeDoIt);
       resizeDoIt = setTimeout(resizePlayerHolder, 100);
    });

   
    $(document).on("click", "a.channelTagLink", function(e) {
    	e.preventDefault();
    	var id = $(this).data('identifier');
    	viewChannels(id);
    });

/*
    $(document).on("click", "a.channelLink", function(e) {
    	e.preventDefault();
    	var id = $(this).data('identifier');
    	var name = $(this).data('name');
    	createStreamWindow(name, id);

    });
*/
    $(document).on("click", "a.channelLink", function(e) {
    	e.preventDefault();
    	mainPlayer.stop();
        // var mediaUrl = '/channel/'+$(this).data('identifier');
        
        socket.emit('switchToChannel', { id: $(this).data('identifier') });

        /*
        $.ajax({
                            url: mediaUrl,
                            dataType: 'json',
                            success: function(responseData, textStatus, jqXHR)
                            {
                                //localStorage.setItem('channelTags', JSON.stringify(responseData.entries));
                                //channelTags = responseData.entries;
                                //viewChannelTags();

                               setTimeout(function() {
                               mainPlayer.play();
                               } , 500);
                            },
                            error: function (responseData, textStatus, errorThrown)
                            {
                                console.warn(responseData, textStatus, errorThrown);

                            }
                        });

        */
    	//mainPlayer.jPlayer("setMedia", {'m4v' : mediaUrl});
    });


    $(document).on("click", "a.backLink", function(e) {
	e.preventDefault();
        viewChannelTags();
	});

    $(document).on("click", "a.toggleLink", function(e) {
        e.preventDefault();
	if ($(this).data('state')=='active') {
          $('#sidebar').stop().animate({
            left: '-260px'

          });
          $(this).text('+');
          $(this).data('state', 'hidden');
        }
        else {
          $('#sidebar').stop().animate({
            left: '0px'
          });
          $(this).text('x');
          $(this).data('state', 'active');
        }
    });


    init();

    

});

  
