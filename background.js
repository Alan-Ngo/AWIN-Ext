

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
  if(request.type == 'clear'){
    arr = [];
    return Promise.resolve({type:'done'});
  } else if(request.type == 'open'){
    console.log('opeinging');
    return Promise.resolve({'tracking':arr});
    /*
    return Promise.resolve(browser.tabs.query({
      currentWindow: true,
      active: true
    }).then( msg => {return Promise.resolve({'tracking':arr})}));
    */
  } else if(request.type == 'cookiePage'){
      page = 1;
  } else if(request.type == 'cookieVal'){
      if(storedCookies[request.val]!=''){
        return Promise.resolve(storedCookies[request.val]);
      }else{
        return null;
      }
  } else if(request.type == 'store'){
    storedCookies[request.select] = request.val;
    console.log(storedCookies[request.select])
    return Promise.resolve("done");
  }else if (request.type == 'storedCookies'){
    console.log("stored",storedCookies);
    return Promise.resolve(storedCookies);
  }
}

//.then(sendMessageToTabs).then(msg=>{return Promise.resolve({'cookie':msg,'tracking':arr})}));

browser.runtime.onMessage.addListener(handleMessage);

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgentHeader,
  {urls: ["*://*/*"]},
  ["blocking", "requestHeaders"]
);
