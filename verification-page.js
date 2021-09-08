var cssPageV = document.createElement('link');
cssPageV.setAttribute('rel', 'stylesheet');
cssPageV.setAttribute('href', 'assets/css/verification-page.css');
document.head.appendChild(cssPageV);

var objectPageV = {
  partnerId: null,
  words: '',
  customerId: '',
  verificationType: '',
  expireMinutes: null,
  uuid: null,
  status: '',
  result: ''
};

function requestVerification(args) {
  const data = JSON.stringify({
    partnerId: args.partnerId,
    words: args.words,
    customerId: args.customerId,
    verificationType: args.verificationType,
    expireMinutes: args.expireMinutes
  })
  objectPageV['partnerId'] = args.partnerId;
  objectPageV['words'] = args.words;
  objectPageV['customerId'] = args.customerId;
  objectPageV['verificationType'] = args.verificationType;
  objectPageV['expireMinutes'] = args.expireMinutes;
  console.log(objectPageV);

  //localStorage.setItem('type', objectPageV.verificationType);

  //loadPageVModal('http://localhost:4200/verification-page/verification-process');

  const xhr = new XMLHttpRequest()
  xhr.withCredentials = true

  xhr.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      console.log(this.responseText)
      var obj = JSON.parse(this.responseText);
      console.log(obj.data.link);
      objectPageV.uuid = parseJwt(getParameterByName('token', obj.data.link)).uuid;
      loadPageVModal(obj.data.link);
      //document.getElementById('page-v-iframe').src = obj.data.link;
      sseValidation();
    }
  })

  xhr.open('POST', 'http://localhost:8080/coredata-verification-api/request-verification')
  xhr.setRequestHeader('content-type', 'application/json')
  xhr.send(data)
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
  //console.log("1")

  sse.addEventListener("SEARCH", function (event) {
    // const data = JSON.parse(event.data).time;
    // console.log(data)
  });

  sse.addEventListener("COMPLETE", function (event) {
    console.log(event);
    console.log(JSON.parse(event.data).result);
    sse.close();
    objectPageV['result'] = JSON.parse(event.data).result;
    objectPageV['status'] = JSON.parse(event.data).status;
    console.log(objectPageV);
    // objectPageV = {
    //   result: JSON.parse(event.data).result
    // }
    //closePageVModal();
  });
}
