// Copyright (c) 2012 The tnimas. All rights reserved.


var oldData = { pop:0, land:0, turns:0};
var destroyLandData = new Date(0);

var attackTimerId = 0;
var gameLoggedTimerId = 0;

function getNotificationId() {
  var id = Math.floor(Math.random() * 9007199254740992) + 1;
  return id.toString();
}

var pauseOptions = {
	"title": "Pause the country monitoring", 
	"contexts":["browser_action"],
	"onclick": function(){
		changeIsActivatedState(false);
		tryConnectIfActivated();
	}
}
var resumeOptions = {
	"title": "Start the country monitoring", 
	"contexts":["browser_action"],
	"onclick": function(){
		changeIsActivatedState(true);
		tryConnectIfActivated();
	}
}
var contextMenuId = chrome.contextMenus.create(JSON.parse(localStorage.isActivated) ? pauseOptions : resumeOptions);

function changeIsActivatedState(state){
	localStorage.isActivated = state;
	delete(pauseOptions.generatedId);
	delete(resumeOptions.generatedId);
	chrome.contextMenus.update(contextMenuId, state ? pauseOptions : resumeOptions);
}



var Connect = {
_connect: false,
_connectedPage : "",
_lastTimeConnected: new Date(0),
getLastTimeConnected : function(){
	return this._lastTimeConnected;
},
setConnect : function(isConnect,url){
	this._connect = isConnect;
	
	if (isConnect){
		var path = "on.png";
		var logged = "You are logged in mars";
		this._lastTimeConnected = new Date();
		this.setHostname(url);
	} else {
		this._connectedPage = "";
		if (JSON.parse(localStorage.isActivated)) {
			var path = "off.png";
			var logged = "You are not logged in mars";
		} else {
			var path = "xz.png";
			var logged = "Mars 2025 helper";
		}
	}
	
	chrome.browserAction.setIcon({path:path});
	chrome.browserAction.setTitle({title:logged});
	},
isConnect: function(){
	return this._connect;
	},
setHostname: function(url){
	var parser = document.createElement('a');
	parser.href = url;
	this._connectedPage = parser.origin;
	},
getHostname: function(){
	return this._connectedPage;
	}
};

function redirectToGamePage() {
var redirectPage = Connect.isConnect() ? Connect.getHostname() + "/TheGame.aspx" : "http://mars2025.net"; 
	chrome.tabs.create( { url: redirectPage, active: true }, function(wnd) {
		chrome.windows.getCurrent(function(w){
		chrome.windows.update(w.id, {focused:true});
});
	});
}

chrome.browserAction.onClicked.addListener(redirectToGamePage);
chrome.notifications.onClicked.addListener(redirectToGamePage);

// listen changes from options
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.activatedStateChanged) {
	  changeIsActivatedState(JSON.parse(localStorage.isActivated));
      tryConnectIfActivated();
	}
  });



if (!JSON.parse(localStorage.isInitialized)) {
  // isActivated means that the game status monitoring is turned on.
  changeIsActivatedState(true);
  // frequency - interval between status monitoring.
  localStorage.frequency = 12;
  localStorage.isInitialized = true; 
} else{
  if (!JSON.parse(localStorage.isActivated)){
    Connect.setConnect(false);
  }
}

//4 hosts; 1 or 0 is avialable. if 1 then the gamer is in the game.
function tryConnect() {
	if (Connect.isConnect()) return;
	getPage("http://mars2025.net/Advisor.aspx",onStartMonitoringForCorrectUrl);
	getPage("http://www.mars2025.net/Advisor.aspx",onStartMonitoringForCorrectUrl);
	getPage("http://www.mars2025.ru/Advisor.aspx",onStartMonitoringForCorrectUrl);
	getPage("http://mars2025.ru/Advisor.aspx",onStartMonitoringForCorrectUrl);
}
function tryConnectIfActivated(delay){
	if (JSON.parse(localStorage.isActivated)){
		// every 60 second check if the gamer is logged in
		clearTimeout(gameLoggedTimerId);
		gameLoggedTimerId = setTimeout(tryConnect, delay);
	} else {
		Connect.setConnect(false);
	}
}
setInterval(function(){
	tryConnectIfActivated();
},60000);

tryConnectIfActivated();

function onStartMonitoringForCorrectUrl(response,url) {
if (response.indexOf("Error.aspx") == -1) {
	//if page != Error.aspx -> gamer in game
	clearInterval(attackTimerId);
	attackTimerId = setInterval(function(){ 
			getPage(url,onProcessMonitoringRequest);
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
function onProcessMonitoringRequest(pageText){
    if (pageText.indexOf("Error.aspx") != -1){
		clearInterval(attackTimerId);
		Connect.setConnect(false);
		return;
	}

	var data = parseStatisticPage(pageText);
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
 var body = (isPop) ? 'The population has decreased!' : 'The land has decreased!' ;
  chrome.notifications.create(null, {
    title: 'Mars 2025: Your country is attacked!',
    iconUrl: 'notif.png',
    type: 'basic',
    message: body
  }, function() {});
  
  audio = new Audio('beep.mp3');
  audio.play();
}

//get meaningful data from statistic page
function parseStatisticPage(pageText){

var pop = gval("ctl00_ContentPlaceHolder1_CAdvisor1_lblPopulation",pageText);
var land = gval("ctl00_ContentPlaceHolder1_CAdvisor1_lblLand",pageText);
var turns = gval("ctl00_lblTurns",pageText);
if (!pop || !land || !turns) {
	pop = -1;
	land = -1;
	turns = -1;
}
return { pop:pop,land:land,turns:turns};
}

//parse pageText for get content of html tag with id = id.
function gval(id, pageText){
	var startText = pageText.slice(pageText.indexOf(id));
	startText = startText.slice(startText.indexOf(">")+1,startText.indexOf("<"));
	return startText.replace(/[^0-9]/g, '');
}

chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
	if (info.url.indexOf("Logout.aspx") != -1){
		Connect.setConnect(false);
	}
	if (info.url.indexOf("Error.aspx") != -1 && Connect.getLastTimeConnected() < new Date(new Date().getTime() - 10000)){
		Connect.setConnect(false);
	}

    if (info.url.indexOf("Destroy.aspx") != -1){
		destroyLandData = new Date();
	}
 
	var indexEnter = info.url.indexOf("Enter");
	var indexEndEnter = info.url.indexOf(".aspx");
	var x = indexEnter+"Enter".length+1;
	if (indexEnter != -1 && indexEndEnter != -1 && (indexEnter+"Enter".length+1) == indexEndEnter){
		oldData = { pop:0, land:0, turns:0};
		tryConnectIfActivated(2000);
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


