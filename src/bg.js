// Copyright (c) 2012 The tnimas. All rights reserved.

var oldData = { pop:0, land:0, turns:0};
var destroyLandData = new Date(0);

var Connect = {
_connect: false,
_connectedPage : "",
setConnect : function(isConnect,url){
	this._connect = isConnect;
	
	if (isConnect){
		var path = "on.png";
		var logged = "You are logged in mars";
		this._connectedPage = url;
	} else {
		var path = "off.png";
		var logged = "You are not logged in mars";
		this._connectedPage = "";
	}
	
	chrome.browserAction.setIcon({path:path});
	chrome.browserAction.setTitle({title:logged});
	},
isConnect: function(){
	return this._connect;
	},
getUrlPage: function(){
	return this._connectedPage;
	}	
};

chrome.browserAction.onClicked.addListener(
	function() {
	var redirectPage = Connect.isConnect() ? Connect.getUrlPage() : "http://mars2025.net"; 
		chrome.tabs.create( { url: redirectPage } );
	}
);


var attackTimerId = 0;
var gameLoggedTimerId = 0;
// Conditionally initialize the options.
if (!localStorage.isInitialized) {
  localStorage.isActivated = true;   // The display activation.
  localStorage.frequency = 12;        // The display frequency, in seconds.
  localStorage.isInitialized = true; // The option initialization.
}

//4 host, 1 or 0 is avialable. if 1 then gamer in game.
function tryConnect() {
	if (Connect.isConnect()) return;
	getPage("http://mars2025.net/TheGame.aspx",urlCorrect);
	getPage("http://www.mars2025.net/TheGame.aspx",urlCorrect);
	getPage("http://www.mars2025.ru/TheGame.aspx",urlCorrect);
	getPage("http://mars2025.ru/TheGame.aspx",urlCorrect);
}

if (JSON.parse(localStorage.isActivated)){
	//every 60 second check on gamer login in game
	tryConnect();
	setInterval(tryConnect,60000);
}

function urlCorrect(response,url) {
if (response.indexOf("Error.aspx") == -1) {
	//if page != Error.aspx -> gamer in game
	clearInterval(attackTimerId);
	attackTimerId = setInterval(function(){ 
			getPage(url,onReq);
		},
		localStorage.frequency*1000
	);
	Connect.setConnect(true,url);
	}
}

//get url and call func with response and url
function getPage(url,func){
	if (JSON.parse(localStorage.isActivated)){
		var req = new XMLHttpRequest();
		req.open("GET",url,true);
		req.onreadystatechange = function() {
		  if (req.readyState == 4) {
			 if(req.status == 200) {
			   func(req.responseText,url);
			 }
		  }
		};
		req.send(null);
	}
}

//processing page response. Get population and land and check with later result
function onReq(pageText){
    if (pageText.indexOf("Error.aspx") != -1){
		clearInterval(attackTimerId);
		Connect.setConnect(false);
		return;
	}

	var data = getData(pageText);
	if (data.pop == -1 || data.land == -1) 
		return;
	var attackedByPop = (oldData.pop > data.pop) && (oldData.turns <= data.turns);
	
	var thisDateSubUpdateTime = new Date();
	thisDateSubUpdateTime.setTime(thisDateSubUpdateTime.getTime() - localStorage.frequency*1000);
	
    var attackedByLand = (oldData.land > data.land) && (thisDateSubUpdateTime > destroyLandData); 	
	if (attackedByPop){
		bob(true);
	}
	if (attackedByLand){
		bob(false);
	}
	oldData = data;
} 

//if all is bad then send notification and sound.
function bob(isPop){
if (window.webkitNotifications) {
 var body = (isPop) ? 'The population has decreased!' : 'The land has decreased!' ;
  var notification = window.webkitNotifications.createNotification(
    'notif.png',                      // The image.
    'Your country is attacked!', // The title.
     body      // The body.
  );
  notification.show();
  audio = new Audio('beep.mp3');
  audio.play();
}
}

//get object data
function getData(pageText){

var pop = gval("ctl00_ContentPlaceHolder1_lblPopulation",pageText);
var land = gval("ctl00_ContentPlaceHolder1_lblLand",pageText);
var turns = gval("ctl00_lblTurns",pageText);
if (!pop || !land || !turns) {
	pop = -1;
	land = -1;
	turns = -1;
}
return { pop:pop,land:land,turns:turns};
}

//parse pageText for get content of html tag with id = id.
function gval(id,pageText){

var startText = pageText.slice(pageText.indexOf(id));
startText = startText.slice(startText.indexOf(">")+1,startText.indexOf("<"));
return startText.replace(/[^0-9]/g, '');
}

chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
    if (info.url.indexOf("Destroy.aspx") != -1){
		destroyLandData = new Date();
	}
	var indexEnter = info.url.indexOf("Enter");
	var indexEndEnter = info.url.indexOf(".aspx");
	var x = indexEnter+"Enter".length+1;
	if (indexEnter != -1 && indexEndEnter != -1 && (indexEnter+"Enter".length+1) == indexEndEnter){
		oldData = { pop:0, land:0, turns:0};
		clearTimeout(gameLoggedTimerId);
		gameLoggedTimerId = setTimeout(tryConnect,2000);
	}
  },
  // filters
  {
    urls: [
      "http://mars2025.net/*",
      "http://mars2025.ru/*",
      "http://www.mars2025.ru/*",
      "http://www.mars2025.net/*" 
    ],
  }
);


