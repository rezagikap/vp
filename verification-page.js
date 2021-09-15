var cssPageV = document.createElement('link');
cssPageV.setAttribute('rel', 'stylesheet');
cssPageV.setAttribute('href', 'https://raw.githack.com/rezagikap/vp/main/verification-page.css');
document.head.appendChild(cssPageV);

var cryptoJS = document.createElement('script');
cryptoJS.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js');
document.head.appendChild(cryptoJS);

var objectPageV = {
  partnerId: null,
  customerId: '',
  verificationType: '',
  expireMinutes: null,
  uuid: null,
  status: '',
  result: ''
};

function requestVerification(args) {
  const data = JSON.stringify({
    customerId: args.customerId,
    verificationType: args.verificationType,
    expireMinutes: args.expireMinutes
  })
  objectPageV['partnerId'] = args.partnerId;
  objectPageV['words'] = args.words;
  objectPageV['customerId'] = args.customerId;
  objectPageV['verificationType'] = args.verificationType;
  objectPageV['expireMinutes'] = args.expireMinutes;
  objectPageV['requestId'] = args.requestId;
  console.log(objectPageV);

  const xhr = new XMLHttpRequest()
  xhr.withCredentials = true

  xhr.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      console.log(this.responseText)
      var obj = JSON.parse(this.responseText);
      console.log(obj.data.link);
      objectPageV.uuid = parseJwt(getParameterByName('token', obj.data.link)).uuid;
      loadPageVModal(obj.data.link);
      sseValidation();
    }
  })
  
  var bodySha256 = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(data));
  let timestamp = (new Date()).toISOString();
  let signatureRawData  = "Client-Id:" + args.partnerId + "\nRequest-Id:" + args.requestId +"\nRequest-Timestamp:" + timestamp + "\nRequest-Target:" + args.requestTarget + "\nDigest:" + bodySha256;
  let signatureHmac = createSignature(signatureRawData, args.secretKey);

  xhr.open('POST', 'http://localhost:8080/coredata-verification-api/request-verification')
  xhr.setRequestHeader('content-type', 'application/json')
  xhr.setRequestHeader('Client-Id', args.partnerId)
  xhr.setRequestHeader('Request-Id', args.requestId)
  xhr.setRequestHeader('Request-Timestamp', timestamp)
  xhr.setRequestHeader('Request-Target', args.requestTarget)
  xhr.setRequestHeader('Signature', "HMACSHA256="+signatureHmac)
  xhr.send(data)
}

function createSignature(rawData, secretKey){
  let signatureUtf8 = CryptoJS.enc.Utf8.parse(rawData);
  var secretUtf8 = CryptoJS.enc.Utf8.parse(secretKey);
  var signatureBytes = CryptoJS.HmacSHA256(signatureUtf8,secretUtf8);
  return CryptoJS.enc.Base64.stringify(signatureBytes);
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function loadPageVModal(url) {
  var pageVModal = document.createElement("div");
  pageVModal.setAttribute('class', 'page-v-modal');
  pageVModal.setAttribute('id', 'page-v-modal');
  pageVModal.innerHTML = '<div class="page-v-content">\n <iframe id="page-v-iframe" src="' + url + '" allow="camera"></iframe>\n </div>';
  document.body.appendChild(pageVModal);
  document.getElementById("page-v-modal").style.display = "block";
}

// Get the modal
var modal = document.getElementById("page-v-modal");
// When the user clicks anywhere outside of the modal, the modal not closed
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "block";
  }
}

function closePageVModal() {
  document.getElementById("page-v-modal").style.display = "none";
  document.getElementById("page-v-modal").remove();
}

//Firefox, Google Chrome and Safari (and Opera and Internet Explorer from version 9).
if (window.addEventListener) {
  window.addEventListener("message", receive, false);
}
//Internet Explorer and Opera
else {
  if (window.attachEvent) {
    window.attachEvent("onmessage", receive, false);
  }
}

function receive(event) {
  var data = event.data;
  if (typeof (window[data.func]) == "function") {
    window[data.func].call(null, data);
  }
}

function sseValidation() {

  var sse = new EventSource('http://localhost:8080/coredata-verification-api/sseValidation?partnerId=' + objectPageV.partnerId + '&customerId=' + objectPageV.customerId + '&orderId=' + objectPageV.uuid);

  sse.addEventListener("SEARCH", function (event) {
  });

  sse.addEventListener("COMPLETE", function (event) {
    console.log(event);
    console.log(JSON.parse(event.data).result);
    sse.close();
    objectPageV['result'] = JSON.parse(event.data).result;
    objectPageV['status'] = JSON.parse(event.data).status;
    console.log(objectPageV);
    //closePageVModal();
  });
}
