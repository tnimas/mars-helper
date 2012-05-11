// Copyright (c) 2012 The tnimas. All rights reserved.

 //helpers
  function pageIs() {
  var page = document.location.pathname.slice(1);
  var needPage = false;
  for (var i =0; i<arguments.length;i++){
	var arg = arguments[i]+'';
	needPage = needPage || (arg == page);
  }
  return needPage;
  }
  function gval(txt) {
        x = getHTML(txt);
        return x.replace(/[^0-9]/g, '')
  }
  function setLocation(targethref){
	window.location.href = targethref;
  }
 //helpers end
  
 
 function getHTML(tag){
	return getObj(tag).innerHTML;
 }
 
 function getObj(tag){
  var firstTry = document.getElementById(tag);
 if (firstTry != null)
	return firstTry;
 var arr = tag.split("_");//in new spy no CAdvisor1
 var res = arr[0]+"_"+arr[1]+"_"+arr[0]+"_"+arr[3];
 return document.getElementById(res);
 }
  
function doWork() { 
  if (pageIs("Advisor.aspx","FullSpy.aspx","Spy.aspx")) { 
//spymod
  var countryName = getObj("ctl00_ContentPlaceHolder1_CAdvisor1_lblCountryName");

if (!countryName || (countryName.innerHTML.indexOf('>GS = ') != -1)) {
	return;
}
    var u = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblAllyExpenses');
    var prav = getHTML('ctl00_ContentPlaceHolder1_CAdvisor1_lblGov');
    var kw = 1;
    var ks = 1;
    if ((prav == 'Диктатура') || (prav == 'Dictatorship')) {
        kw = 1.25;
        ks = 1.3;
    } else if ((prav == 'Республика') || (prav == 'Republic')) kw = 0.9;
    var id = getHTML('ctl00_ContentPlaceHolder1_CAdvisor1_lblCountryName');
    var spy = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblSpies');
    var g = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblLand');
    var prozent = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblprSpy');
    var troop = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblTroops');
    var turret = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblTurrets');
    var tank = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblTanks');
    var wart = gval('ctl00_ContentPlaceHolder1_CAdvisor1_lblprWeapons');
    var ss = Math.ceil((parseInt(troop) / 2 + parseInt(turret) + parseInt(tank) * 2) * parseInt(wart) * kw / 100000 + 0.5);
    if ((u > 0) && (u < (parseInt(g) * 10))) {
        var un = 'Yes';
        var oon = 'No';
    } else if (u > (parseInt(g) * 10)) {
        var un = 'Yes';
        var oon = '?';
    } else if (u == (parseInt(g) * 10)) {
        var un = 'No';
        var oon = 'Yes';
    } else {
        var un = 'No';
        var oon = 'No';
    }
   var analisisOutput = 
    '<br/>Spal = ' + Math.round(eval(spy / g * prozent * ks)) / 100 + 
	'<br/>GS = ' + Math.ceil(eval((troop * wart * kw / 100 + 500) / 1000)) + 'k'+
	'<br/>BR = ' + Math.ceil(eval((turret * wart * kw / 100 + 500) / 1000)) + 'k'+
	'<br/>AB = ' + Math.ceil(eval((tank * wart * kw / 100 + 250) / 1000)) + 'k'+
	'<br/>SS = ' + ss + 'k'+
	'<br/>PS = ' + Math.ceil(ss / 1.5) + 'k'+
	'<br/>Alliance/UN: ' + un + '/' + oon;
	countryName.innerHTML +="<br/>"+analisisOutput;
//spymod end
} else  if (pageIs("TheGame.aspx")) {
//attack_control

//attack_control end
}

}
doWork();
setInterval(doWork,3000);//for user spy with ajax

