var domains = ["www.awin1.com", "www.dwin1.com", "www.zenaps.com"];
var search = ['sread.php', 'sread.js', 'sread.img'];
var arr = [];
var page = 0;
var storedCookies = {'First':/_aw_m_\d+/,'Third':/aw\d+/,'S2S':'','Other':''};

function rewriteUserAgentHeader(e) {
  try {
      if (domains.indexOf(e.requestHeaders[0].value) != -1) {
          var today = new Date();
          var time = round(today.getHours()) + ":" + round(today.getMinutes());
          obj = { url: time + ' ' + e.url};
          arr.push(obj);
      }
    }
    catch(err) {
      console.log(err);
    }
}

function round(val){
  if(val.toString().length<2){
    return '0'+val;
  }
  return val;
}

function sendMessageToTabs(tabs) {
  console.log('msg to tabs');
  return Promise.resolve(browser.tabs.sendMessage(
    tabs[0].id,
    {type: 'cookie'}).then((msg)=>{
      console.log('got cookie'+msg);
      return Promise.resolve(msg);
    }));
}

function onError(error) {
  console.error(`Error: ${error}`);
}

function handleMessage(request, sender, sendResponse){ 
  switch(request.type){
    case 'clear':
      arr = [];
      return Promise.resolve({type:'done'});
    case 'open':
      return Promise.resolve({'tracking':arr});
    case 'cookiePage':
      page = 1;
      break;
    case 'cookieVal':
      if(storedCookies[request.val]!=''){
        return Promise.resolve(storedCookies[request.val]);
      }else{
        return null;
      }
    case 'store':
      storedCookies[request.select] = request.val;
      return Promise.resolve("done");
    case 'done':
      console.log("retrieve cookies");
      return Promise.resolve(storedCookies);
  }
}

browser.runtime.onMessage.addListener(handleMessage);

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgentHeader,
  {urls: ["*://*/*"]},
  ["blocking", "requestHeaders"]
);
