class Page {


  constructor(mod) {
    this.pages = ["popup-content", "cookie-content"];
    this.fields = ["tracking", "cookie"];
    this.m = mod;
    console.log(this.m);
    this.initialSetup();
  }

  selectPage(...args) {
    for (var i = 0; i < args.length; i++) {
      document.getElementById(this.pages[i]).style.display = args[i] ? "grid" : "none";
    }
  }

    
  clearTracking() {
    this.fields.forEach((field) => document.getElementById(field).innerHTML = "");
    browser.runtime.sendMessage({ type: 'clear' });
  }

  initialSetup() {
    document.addEventListener("click", (e,model)=>{this.controller(e,model)});

    document.getElementsByClassName("buttons")[0].style = "color:white;";
    this.selectPage(true, false);
  
    for (var i = 0; i < document.getElementsByClassName("buttons").length; i++) {
      document.getElementsByClassName("buttons")[i].addEventListener('click', model.selectCookie, true);
    }

    window.addEventListener('DOMContentLoaded', (event) => {
      model.openHeaders();
    });
  }

  controller(e) {
    switch (e.target.classList[0]) {
      case "clear":
        page.clearTracking();
        break;
      case "screenshot":
        model.screenshot();
        break;
      case "saveHeader":
        model.saveHeaders()
        break;
      case "savePage":
        model.savePage();
        break;
      case "delCookie":
        model.deleteCookie();
        break;
      case "openCookie":
        model.openCookie();
        break;
      case "back":
        this.selectPage(true, false);
        break;
      case "selectCookie":
        model.storeCookie(e);
        break;
    }
  }
}

class Model {

  constructor() {
    //containing the cookie headers
    this.obj;
    //Cookie selection and type
    this.cookieSelect = "First";
    this.cookieType = "";

   }

   openHeaders(){
    browser.runtime.sendMessage({ type: 'open' }).then(model.headers.bind(this))
   }

   
  headers(msg) {
    this.obj = msg;
    //document.getElementById("cookie").innerHTML = msg.cookie;
    browser.runtime.sendMessage({ type: 'cookieVal', val: this.cookieSelect }).then((msg) => { browser.cookies.getAll({}).then((c) => model.checkCookies(c, msg)) });

    for (var i = 0; i < msg.tracking.length; i++) {
      document.getElementById("tracking").innerHTML += msg.tracking[i].url + "<br/><br/>";
    }
  }

  getFormattedDate(sepDate, sepTime, time, full = false) {
    var date = new Date();

    if (typeof time == undefined) {
      date.setUTCSeconds(time);
    }

    var dd = this.round(date.getDate());
    var mm = this.round(date.getMonth()) + 1;
    var yyyy = date.getFullYear();

    var fDate = dd + sepDate + mm + sepDate + yyyy;
    var fTime = this.round(date.getHours()) + sepTime + this.round(date.getMinutes())

    if (full) {
      return fDate;
    } else {
      return fDate + ' ' + fTime;
    }
  }

  round(val) {
    if (val.toString().length < 2) {
      return '0' + val;
    }
    return val;
  }

  downloads(blob, ext) {
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      var url = new URL(tab.url);
      //Regex does not do without the font www
      var patt = /\.[a-z]+\./g;

      try {
        var domain = ((url.hostname).match(patt).toString()).slice(1, -1);
      } catch{
        var domain = url.hostname;
      }

      var directory = model.getFormattedDate("-", "-", undefined, true) + ' ' + domain + '/';

      browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: directory + domain + ' ' + model.getFormattedDate("-", "-") + '.' + ext,
        conflictAction: 'uniquify'
      })
    })
  }

  dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  //name needs changing
  saveCookies(c, msg) {
    var header = '';
    header += model.getFormattedDate('/', ':') + '\r\n\r\n';
    //console.log(msg);
    for (var i = 0; i < c.length; i++) {
      for (var val in msg) {
        var re = new RegExp(msg[val], 'g');
        if (msg[val] != '' && c[i]["name"].match(re)) {
          var string =
            'Name: ' + c[i]['name'] + '\r\n' +
            'Value: ' + c[i]['value'] + '\r\n' +
            'Expiry date: ' + model.getFormattedDate("/", ":", c[i]['expirationDate']) + '\r\n' +
            'Secure:' + c[i]['secure'] + ' ' +
            'httpOnly:' + c[i]['httpOnly'] + ' ' +
            'Session:' + c[i]['session'] + ' ';

          header += val + '\r\n' + string + '\r\n\r\n';
          break;
        }
      }
    }
    header += '\r\n';
    
    var selectOrder = {'tt=ns':[],'tt=js':[],'basket':[]};
    var all = "";

    for (var i = 0; i < this.obj.tracking.length; i++) {
      for(var j=0;j<Object.keys(selectOrder).length;j++){
        var re = new RegExp(Object.keys(selectOrder)[j], 'g');
        if (this.obj.tracking[i].url.match(re)){
          console.log('found one')
          selectOrder[Object.keys(selectOrder)[j]].push(this.obj.tracking[i].url)
        }
      }
      all += this.obj.tracking[i].url + "\r\n";
    }

    //need to fix for multiple plt
    for(var element in selectOrder){
      if(element == "basket"){
        header += decodeURI(selectOrder[element]) + "\r\n";
      }else{
        header += selectOrder[element] + "\r\n";
      }
    }
    
    header += "\r\n";

    header+=all;

    this.downloads(this.createBlob(header, 'text/plain'), 'txt');
  }

  getCookies(cook) {
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
          var string = '<div class="cookieList"> ' +
            '<b>Name:</b> ' + cook[i]['name'] + '</br>' +
            '<b>Value:</b> ' + cook[i]['value'] + '</br>' +
            '<b>Expiry date:</b> ' + model.getFormattedDate("/", ":", cook[i]['expirationDate']) + '<br/> ' +
            '<b>Secure:</b> ' + model.checkbox(cook[i]['secure']) + ' ' +
            '<b>httpOnly:</b> ' + model.checkbox(cook[i]['httpOnly']) + ' ' +
            '<b>Session:</b> ' + model.checkbox(cook[i]['session']) + ' ' +
            '<button class="selectCookie" name="' + cook[i]['name'] + '">Select</button>' +
            '</div></br>';
          document.getElementById("listCookies").innerHTML += string;
        }
      }
      document.getElementById("listCookies").innerHTML += '<br/>';
    });
  }

  checkbox(val) {
    if (val) {
      return '<input type="checkbox"  checked readonly></input>';
    } else {
      return '<input type="checkbox"readonly></input>';
    }
  }

  removeCookie(c) {
    var whitelist = ["awin.lightning.force.com", "http://ui.awin.com/"];
    for (var i = 0; i < c.length; i++) {
      browser.cookies.remove({ url: ((c[i].secure) ? 'https://' : 'http://') + c[i].domain + c[i].path, name: c[i].name });
    }
  }

  createBlob(data, type) {
    return new Blob([data], { type: type });
  }



  screenshot() {
    browser.tabs.captureVisibleTab().then(dataURL => { this.downloads(this.dataURLtoBlob(dataURL), 'jpeg') }, this.onError);
  }

  saveHeaders() {
    //add cookie to header
    browser.runtime.sendMessage({ type: 'done' }).then((msg) => {
      browser.cookies.getAll({}).then((c) => this.saveCookies(c, msg))
    });
  }

  savePage() {
    console.log('sending message');
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then(tabs => browser.tabs.sendMessage(tabs[0].id, { type: 'page' }))
      .then(html => {
        //var blob = new Blob([html], {type : 'text/html'});
        this.downloads(this.createBlob(html, 'text/html'), 'html');
      });
  }

  deleteCookie() {
    browser.cookies.getAll({}).then(this.removeCookie);
    console.log("delete");
    caches.keys().then(function (keyList) {
      keyList.forEach(element => {
        caches.delete(key);
      })
    });
  }

  openCookie() {
    page.selectPage(false, true);
    browser.cookies.getAll({}).then(this.getCookies);
  }

  storeCookie(e) {
    //send to background to store name
    browser.runtime.sendMessage({ type: 'store', select: this.cookieSelect, val: e.target.name }).then((msg) => {
      page.selectPage(true, false);
      //refresh cookie
      browser.runtime.sendMessage({ type: 'cookieVal', val: this.cookieSelect }).then((msg) => { browser.cookies.getAll({}).then((c) => {model.checkCookies(c, msg)}) });
    });
  }
  checkCookies(c, val) {
    var ind = null;
    //browser.runtime.sendMessage({type:'cookieVal',val:cookieSelect}).then(changeCookie);
    if (val != null) {
      for (var i = 0; i < c.length; i++) {
        
        var re = new RegExp(val, 'g');
        if (c[i]["name"].match(re)) {
          console.log("yes");
          console.log(c[i]["name"]);
          ind = i;
          break;
        }
      }

      
      var string = '<div> ' +
        '<b>Name:</b> ' + c[ind]['name'] + '</br>' +
        '<b>Value:</b> ' + c[ind]['value'] + '</br>' +
        '<b>Expiry date:</b> ' + model.getFormattedDate("/", ":", c[i]['expirationDate']) + ' ' + '<br/> ' +
        '<b>Secure:</b> ' + model.checkbox(c[ind]['secure']) + ' ' +
        '<b>httpOnly:</b> ' + model.checkbox(c[ind]['httpOnly']) + ' ' +
        '<b>Session:</b> ' + model.checkbox(c[ind]['session']) + ' ' +
        '</div></br>';
      
      document.getElementById("cookie").innerHTML = string;
    }
    else {
      document.getElementById("cookie").innerHTML = '<button class="openCookie">Find</button>';
    }
  }

  selectCookie(e) {
    for (var i = 0; i < e.target.parentNode.children.length; i++) {
      if (e.target.parentNode.children[i].innerText == e.target.textContent) {
        e.target.parentNode.children[i].style.color = "white";
        //set mode
        this.cookieSelect = e.target.textContent;
      } else {
        e.target.parentNode.children[i].style.color = "black";
      }
    }
    //get the correct value to populate
    browser.runtime.sendMessage({ type: 'cookieVal', val: this.cookieSelect }).then((msg)=>{browser.cookies.getAll({}).then((c)=>model.checkCookies(c,msg))})
  }

  changeCookie(msg) {
    this.cookieType = msg;
  }

  onError(error) {
    console.error(`Error: ${error}`);
  }
}


var model = new Model();
var page = new Page(model);
