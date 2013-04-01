tvheadendWebplayer
==================

A webplayer app for tvheadend. 

A little fun project to learn new technologies like node.js. 


What it does:
----------------- 

It offers a nicer tvheadend webinterface, for just watching TV.

The Webinterface tvheadend offers just has support for VLC plugin and "zapping" is a pain with it.
It was made to admin tvheadend. This is made, to use tvheadend. 


![Meh Screenshot](http://i.imgur.com/4xexQVS.jpg)


What external libraries/tools are needed?
-----------------
 
 - crtmpserver 
 - avconv
 - node.js / npm
 - bower
 - flash plugin (maybe I'll switch to real Apple HLS)

The webapp is served by node.js server. Also the avconv process is controlled by this instance.

I use bower for managing client-side libs like jquery, nanoscroller etc
Just type `bower install` in project root.


How to start this thing?
----------------

`git clone git@github.com:mablae/tvheadendWebplayer.git`
`cd tvheadendWebplayer`
`npm install`
`bower install`
`node app.js`

Open `http://127.0.0.1:4000/` in webbrowser. 


TODO:
----------------

 - Make a config file or config in webinterface or both
   Options needed: 
   - IP-Adress of tvheadend
   - Port of tvheadend
   - Port to run this on

   - Make the streaming settings configurable

 - EPG (what is running on channel)
 - Highlight current tuned channel
 - Shutdown the stream (maybe on window.close() event ?)
