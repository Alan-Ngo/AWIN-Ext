var obj;

var cookieSelect = "First";
var cookieType = "";
document.getElementsByClassName("buttons")[0].style = "color:white;";

document.getElementById("cookie-content").style.display = "none";
document.getElementById("popup-content").style.display = "grid";

document.addEventListener("click", function (e) {
  //console.log(e);
  if (e.target.classList.contains("clear")) {
    document.getElementById("tracking").innerHTML = "";
    document.getElementById("cookie").innerHTML = "";
    browser.runtime.sendMessage({ type: 'clear' });
  } else if (e.target.classList.contains("screenshot")) {
    browser.tabs.captureVisibleTab().then(dataURL => { downloads(dataURLtoBlob(dataURL), 'jpeg') }, onError);
  } else if (e.target.classList.contains("saveHeader")) {
    var header = '';

    //add cookie to header
    browser.runtime.sendMessage({type:'storedCookies'}).then((msg)=>{
      browser.cookies.getAll({}).then((c)=>addCookies(c,msg))
    });


  } else if (e.target.classList.contains("savePage")) {
    console.log('sending message');
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then(tabs => browser.tabs.sendMessage(tabs[0].id, { type: 'page' }))
      .then(html => {
        //var blob = new Blob([html], {type : 'text/html'});
        downloads(createBlob(html, 'text/html'), 'html');
      });
  } else if (e.target.classList.contains('delCookie')) {
    browser.cookies.getAll({}).then(removeCookie);
    console.log("delete");
    caches.keys().then(function (keyList) {
      keyList.forEach(element => {
        caches.delete(key);
      })
    });
  } else if (e.target.classList.contains('openCookie')) {
    document.getElementById("cookie-content").style.display = "grid";
    document.getElementById("popup-content").style.display = "none";

    browser.cookies.getAll({}).then(getCookies);
  } else if (e.target.classList.contains('back')) {
    document.getElementById("cookie-content").style.display = "none";
    document.getElementById("popup-content").style.display = "grid";
  } else if(e.target.classList.contains('selectCookie')){
    //send to background to store name
    console.log(e.target.name);
    browser.runtime.sendMessage({type:'store',select:cookieSelect,val:e.target.name}).then((msg)=>{      
      document.getElementById("cookie-content").style.display = "none";
      document.getElementById("popup-content").style.display = "grid";
      //refresh cookie
      browser.runtime.sendMessage({type:'cookieVal',val:cookieSelect}).then((msg)=>{browser.cookies.getAll({}).then((c)=>checkCookies(c,msg))});
    });
  }
});

function addCookies(c,msg){
  var header = '';

  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  header += dateTime + '\r\n\r\n';

  for (var i = 0; i < c.length; i++) {
    for (val in msg) {
      //console.log(val);
      var re = new RegExp(msg[val], 'g');
      if(msg[val]!='' && c[i]["name"].match(re)){
        var d = new Date(0);
        d.setUTCSeconds(c[i]['expirationDate']);

     

      var dd = d.getDate();
      var mm = d.getMonth() + 1;
      var yyyy = d.getFullYear();
    
    
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      var today = dd + '/' + mm + '/' + yyyy;
      var time = round(d.getHours()) + ":" + round(d.getMinutes())

          var string = 
          'Name: ' + c[i]['name'] + '\r\n' +
          'Value: ' + c[i]['value'] + '\r\n' +
          'Expiry date: ' + today +' '+time + '\r\n' +
          'Secure: ' + c[i]['secure'] + ' ' +
          'httpOnly: ' + c[i]['httpOnly'] + ' ' +
          'Session: ' + c[i]['session'] + ' ' ;

          header += val + '\r\n'+ string +'\r\n\r\n';
          break;
      }
    }
  }
  //alert(msg);
  header += '\r\n'

  for (var i = 0; i < obj.tracking.length; i++) {
    header += obj.tracking[i].url + "\r\n";
  }
  downloads(createBlob(header, 'text/plain'), 'txt');
}

for(var i=0; i<document.getElementsByClassName("buttons").length;i++){
  //document.getElementsByClassName("buttons")[i].onclick = yo;
  document.getElementsByClassName("buttons")[i].addEventListener('click',yo,true);
}


function yo(e){
  for(var i =0;i<e.target.parentNode.children.length;i++){
    //console.log(e.target.textContent,e.target.children[i].innerText);
    if(e.target.parentNode.children[i].innerText == e.target.textContent){
      e.target.parentNode.children[i].style.color = "white";
      //set mode
      cookieSelect = e.target.textContent;
    }else{
      e.target.parentNode.children[i].style.color = "black";
    }
  }
  //get the correct value to populate
  browser.runtime.sendMessage({type:'cookieVal',val:cookieSelect}).then((msg)=>{browser.cookies.getAll({}).then((c)=>checkCookies(c,msg))});

}

function getCookies(cook) {
  //console.log(cook,cook["domain"]);
  browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    var url = new URL(tab.url)
    //Regex does not do without the font www
    var patt = /\.[a-z]+\./g;

    try {
      var domain = ((url.hostname).match(patt).toString()).slice(1, -1);
    } catch{
      var domain = url.hostname;
    }

    var patt = /\.[a-z]+\./g;

    for (var i = 0; i < cook.length; i++) {
      if ((cook[i]["domain"]).indexOf(domain) != -1) {
        var d = new Date(0);
          d.setUTCSeconds(cook[i]['expirationDate']);

       

        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        var yyyy = d.getFullYear();
      
      
        if (dd < 10) {
          dd = '0' + dd;
        }
        if (mm < 10) {
          mm = '0' + mm;
        }
        var today = dd + '/' + mm + '/' + yyyy;
        var time = round(d.getHours()) + ":" + round(d.getMinutes())

        var string = '<div class="cookieList"> ' +
          '<b>Name:</b> ' + cook[i]['name'] + '</br>' +
          '<b>Value:</b> ' + cook[i]['value'] + '</br>' +
          '<b>Expiry date:</b> ' + today +' '+time + '<br/> ' +
          '<b>Secure:</b> ' + checkbox(cook[i]['secure']) + ' ' +
          '<b>httpOnly:</b> ' + checkbox(cook[i]['httpOnly']) + ' ' +
          '<b>Session:</b> ' + checkbox(cook[i]['session']) + ' ' +
          '<button class="selectCookie" name="'+cook[i]['name']+'">Select</button>'+
          '</div></br>';
        document.getElementById("listCookies").innerHTML += string;
      }
    }

    document.getElementById("listCookies").innerHTML += '<br/>';

  });
}


function cookieSelector(e){
  console.log(e);
}

function checkbox(val){
  if(val){
    return '<input type="checkbox"  checked readonly></input>';
  }else{
    return '<input type="checkbox"readonly></input>';
  }
}

function removeCookie(c) {
  var whitelist = ["awin.lightning.force.com", "http://ui.awin.com/"];
  //{ name: "clientSrc", value: "2.221.199.50", domain: "awin.lightning.force.com", hostOnly: true, path: "/", secure: true, httpOnly: false, sameSite: "no_restriction", session: true, firstPartyDomain: "", … }
  for (var i = 0; i < c.length; i++) {
    browser.cookies.remove({ url: ((c[i].secure) ? 'https://' : 'http://') + c[i].domain + c[i].path, name: c[i].name });
    //if(whitelist.includes(c[i].domain)==-1){

    //}

  }
  console.log('removed all cookies');
}

function createBlob(data, type) {
  return new Blob([data], { type: type });
}

function round(val) {
  if (val.toString().length < 2) {
    return '0' + val;
  }
  return val;
}

function headers(msg) {
  obj = msg;
  //document.getElementById("cookie").innerHTML = msg.cookie;
  browser.runtime.sendMessage({type:'cookieVal',val:cookieSelect}).then((msg)=>{browser.cookies.getAll({}).then((c)=>checkCookies(c,msg))});
  

  for (var i = 0; i < msg.length; i++) {
    console.log(msg[i]);
  }
 

  for (var i = 0; i < msg.tracking.length; i++) {
    document.getElementById("tracking").innerHTML += msg.tracking[i].url + "<br/><br/>";
  }
}

function changeCookie(msg){
  cookieType = msg;
}

function checkCookies(c,val){
  var ind = null;
  //browser.runtime.sendMessage({type:'cookieVal',val:cookieSelect}).then(changeCookie);
  if(val!=null){
    for (var i = 0; i < c.length; i++) {
      
      var re = new RegExp(val, 'g');
      console.log(c[i]["name"]+' asd '+re)
      if(c[i]["name"].match(re)){   
        console.log(c[i]["name"]);
        ind = i;
        break;
      }
    }
  
    var d = new Date(0);
    d.setUTCSeconds(c[ind]['expirationDate']);
    var dd = d.getDate();
    var mm = d.getMonth() + 1;
    var yyyy = d.getFullYear();
  
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
  
    var time = round(d.getHours()) + ":" + round(d.getMinutes())
  
    var today = dd + '/' + mm + '/' + yyyy;
    var string = '<div> ' +
            '<b>Name:</b> ' + c[ind]['name'] + '</br>' +
            '<b>Value:</b> ' + c[ind]['value'] + '</br>' +
            '<b>Expiry date:</b> ' + today+' '+time+ ' ' + '<br/> ' +
            '<b>Secure:</b> ' + checkbox(c[ind]['secure']) + ' ' +
            '<b>httpOnly:</b> ' + checkbox(c[ind]['httpOnly']) + ' ' +
            '<b>Session:</b> ' + checkbox(c[ind]['session']) + ' ' +
            '</div></br>';
  
    document.getElementById("cookie").innerHTML = string;
  }
  else{
    document.getElementById("cookie").innerHTML = '<button class="openCookie">Find</button>';
  }
}

function onError(error) {
  console.error(`Error: ${error}`);
}

function downloads(blob, ext) {
  browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    var url = new URL(tab.url)
    //Regex does not do without the font www
    var patt = /\.[a-z]+\./g;

    try {
      var domain = ((url.hostname).match(patt).toString()).slice(1, -1);
    } catch{
      var domain = url.hostname;
    }

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }

    var time = round(today.getHours()) + "-" + round(today.getMinutes())

    var today = dd + '-' + mm + '-' + yyyy;
    var directory = today + ' ' + domain + '/';

    browser.downloads.download({
      url: URL.createObjectURL(blob),
      filename: directory + domain + ' ' + today + ' ' + time + '.' + ext,
      conflictAction: 'uniquify'
    })
  })
}

function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

window.addEventListener('DOMContentLoaded', (event) => {
  console.log('open tab');
  browser.runtime.sendMessage({ type: 'open' }).then(headers)

  console.log('close tab');
});