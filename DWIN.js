var cookie = '';

function handleMessage(request, sender, sendResponse) {
  if(request.type=='cookie'){
    console.log('page cookie');
    //cookie = document.cookie;
    document.cookie.split(';').forEach((i)=>{
      //Check for AWIN cookie *need to check awin as well
      if(i.includes("_aw_m_")){
        cookie = i;
      }
      
      console.log(1);
    });;
    return Promise.resolve(cookie);
  } else if(request.type == 'page'){
    console.log(document.getElementsByTagName('html')[0].innerHTML);
      return Promise.resolve(document.getElementsByTagName('html')[0].innerHTML);
  } else if (request.type == 'paste'){
    console.log('paste working');
    var text="yooo";
    navigator.clipboard.writeText(text).then(function() {
      console.log("sucessful");
    }, function() {
      console.log("noooooo");
    });
    var t = document.execCommand("paste", false, text);
    console.log(t);
  }
}

browser.runtime.onMessage.addListener(handleMessage);