_satellite.pushAsyncScript(function(event,target,$variables){var DTM_dlh=document.location.hostname;var DTM_dlp=document.location.pathname;var DTM_ncomm=document.createComment('Placement of Nielsen Script');var DTM_nscript=document.createElement('script');var DTM_nscriptContent=document.createTextNode("(function () {\n\
  _satellite.notify('Nielsen Pixel Set');\n\
  var d = new Image(1, 1); \n\
  d.onerror = d.onload = function () { \n\
    d.onerror = d.onload = null;\n\
  };\n\
  d.src = [\"//secure-us.imrworldwide.com/cgi-bin/m?ci=us-805104h&cg=0&cc=1&si=\", escape(window.location.href), \"&rp=\", escape(document.referrer), \"&ts=compact&rnd=\", (new Date()).getTime()].join('');\n\
})();");DTM_nscript.type='text/javascript';DTM_nscript.appendChild(DTM_nscriptContent);if(!DTM_dlh.match(/uclick.com/)&&!DTM_dlp.match(/client\/nydn/i)){document.body.appendChild(DTM_ncomm);document.body.appendChild(DTM_nscript);}});