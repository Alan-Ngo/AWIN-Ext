var domains = ["www.awin1.com", "www.dwin1.com", "www.zenaps.com"];
var search = ['sread.php', 'sread.js', 'sread.img'];
var arr = [];
var page = 0;
var storedCookies = { 'First': /_aw_m_\d+/, 'Third': /aw\d+/, 'S2S': '', 'Other': '' };
var numShortcuts = 9;
var shortcuts = [];
var date, opens;

initial();

function initial() {
  for (var i = 0; i < numShortcuts; i++) {
    shortcuts.push('');
  }
}

function rewriteUserAgentHeader(e) {
  try {
    if (domains.indexOf(e.requestHeaders[0].value) != -1) {
      var today = new Date();
      var time = round(today.getHours()) + ":" + round(today.getMinutes());
      obj = { url: time + ' ' + e.url };
      arr.push(obj);
    }
  }
  catch (err) {
    console.log(err);
  }
}

function verify() {
  fetch('https://demo3021139.mockable.io/awin')
    .then((res) => {
      if (res.ok) {
        return res.json()
      }
    })
    .then((v) => {
      date = new Date().getDate();
      if (v.msg == 1) {
        opens = true;
      } else {
        opens = false;
      }
    });
}

function checkOpen() {
  if (date != undefined) {
    if (parseInt(date) < parseInt(new Date().getDate())) {
      verify();
    }
  } else {
    verify();
  }
}

function round(val) {
  if (val.toString().length < 2) {
    return '0' + val;
  }
  return val;
}

function sendMessageToTabs(tabs,value) {
  browser.tabs.sendMessage(
    tabs[0].id,
    { type: 'paste',val:value});
}

function onError(error) {
  console.error(`Error: ${error}`);
}

function handleMessage(request, sender, sendResponse) {
  switch (request.type) {
    case 'clear':
      arr = [];
      storedCookies['S2S'] = '';
      storedCookies['Other'] = '';
      //need to clear cookies
      return Promise.resolve({ type: 'done' });
    case 'open':
      return Promise.resolve({ 'tracking': arr });
    case 'cookiePage':
      page = 1;
      break;
    case 'cookieVal':
      if (storedCookies[request.val] != '') {
        return Promise.resolve(storedCookies[request.val]);
      } else {
        return null;
      }
    case 'store':
      console.log("store", storedCookies, request.select, request.val);
      storedCookies[request.select] = request.val;
      return Promise.resolve("done");
    case 'done':
      console.log("retrieve cookies");
      return Promise.resolve(storedCookies);
    case 'valid':
      console.log(opens);
      return Promise.resolve(opens);
    case 'short':
      console.log('shortcutsssssss', shortcuts);
      return Promise.resolve(shortcuts);
    case 'storeShortcuts':
      shortcuts = request.val;
  }
}

document.addEventListener('load', () => { console.log(123) })
browser.runtime.onMessage.addListener(handleMessage);

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgentHeader,
  { urls: ["*://*/*"] },
  ["blocking", "requestHeaders"]
);

checkOpen();
window.setInterval(function () {
  checkOpen();
}, 1000 * 60 * 60);

browser.commands.onCommand.addListener(function (command) {
  var l = command.split('+');

  if(l[0]=="Ctrl"&&l[1]=="Shift"&& !isNaN(l[2])){
    console.log("firing");
    var value = shortcuts[l[2]-1];
    console.log(value);
    browser.tabs.query({ active: true, currentWindow: true }).then((tab) => sendMessageToTabs(tab,value));
  }
});

/*

navigator.clipboard.writeText("yooo wassup").then(function() {
      console.log("Success in writing to clipboard");

      navigator.clipboard.readText().then(text => outputElem.innerText = text);
    }, function() {
      console.log("Failed in writing to clipboard");
    });
    console.log("Toggling the feature!");

    */