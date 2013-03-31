tvheadendWebplayer
==================

A webplayer app for tvheadend.  

What it does:
----------------- 

It offers a nice webinterface, just for watching TV. 

Not less. Not more. 

![Meh Screenshot](http://i.imgur.com/4xexQVS.jpg)


What is needed?
-----------------
 
- crtmpserver 

 Install using `sudo apt-get install crtmpserver`

 Default config is right and we can use it out of the box.


- avconv

 The successor of ffmpeg is used to convert the video to a smaller size and bitrate. 


- node.js / express.js

The webapp is served by node.js server. Also the avconv process is controlled by this instance.


- bower

We use bower for managing client-side libs like jquery, nanoscroller etc
Just type `bower install` in project root.

