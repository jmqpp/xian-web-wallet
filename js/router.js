var app_page = "get-started";
var app_box = document.getElementById("app-box");
var publicKey = null;
var unencryptedPrivateKey = null;
var locked = true;
var tx_history = JSON.parse(localStorage.getItem("tx_history")) || [];

function changePage(page, some_data = null) {
  app_page = page;
  const loadHtmlAndScripts = (htmlPath) => {
    fetch(htmlPath)
      .then((response) => response.text())
      .then((htmlContent) => insertHTMLAndExecuteScripts(app_box, htmlContent))
      .then(() => {
        if (page === "send-token")
          document.getElementById("tokenName").innerHTML = some_data;
        else if (page === "request") {
          document.getElementById("requestFrom").innerHTML =
            some_data["event"].origin;
          document.getElementById("requestFrom2").innerHTML =
            some_data["event"].origin;
          document.getElementById("contractRequest").innerHTML =
            some_data["data"]["contract"];
          document.getElementById("methodRequest").innerHTML =
            some_data["data"]["method"];
          document.getElementById("kwargsRequest").innerHTML =
            JSON.stringify(some_data["data"]["kwargs"]);
          document.getElementById("stampLimitRequest").innerHTML =
            some_data["data"]["stampLimit"];
        }
        else if (page === "password-input") {
          document.getElementById("side-nav").style.display = "none";
          document.getElementById("app-box").style.borderTopLeftRadius = "8px";
          document.getElementById("app-box").style.borderBottomLeftRadius = "8px";
          document.getElementById("app-box").style.borderLeftWidth = "1px";
        }
        else if (page === "create-wallet") {
          document.getElementById("side-nav").style.display = "none";
          document.getElementById("app-box").style.borderTopLeftRadius = "8px";
          document.getElementById("app-box").style.borderBottomLeftRadius = "8px";
          document.getElementById("app-box").style.borderLeftWidth = "1px";
        }
        else if (page === "import-wallet") {
          document.getElementById("side-nav").style.display = "none";
          document.getElementById("app-box").style.borderTopLeftRadius = "8px";
          document.getElementById("app-box").style.borderBottomLeftRadius = "8px";
          document.getElementById("app-box").style.borderLeftWidth = "1px";
        }
        else if (page === "get-started") {
          document.getElementById("side-nav").style.display = "none";
          document.getElementById("app-box").style.borderTopLeftRadius = "8px";
          document.getElementById("app-box").style.borderBottomLeftRadius = "8px";
          document.getElementById("app-box").style.borderLeftWidth = "1px";
        }
        else{
          document.getElementById("side-nav").style.display = "flex";
          document.getElementById("app-box").style.borderLeftWidth = "0px";
          document.getElementById("app-box").style.borderTopLeftRadius = "0px";
          document.getElementById("app-box").style.borderBottomLeftRadius = "0px";
        }
      });
  };

  switch (app_page) {
    case "get-started":
      loadHtmlAndScripts("templates/get-started.html");
      break;
    case "create-wallet":
      loadHtmlAndScripts("templates/create-wallet.html");
      break;
    case "import-wallet":
      loadHtmlAndScripts("templates/import-wallet.html");
      break;
    case "wallet":
      loadHtmlAndScripts("templates/wallet.html");
      break;
    case "password-input":
      loadHtmlAndScripts("templates/password-input.html");
      break;
    case "send-token":
      loadHtmlAndScripts("templates/send-token.html");
      break;
    case "receive-token":
      loadHtmlAndScripts("templates/receive-token.html");
      break;
    case "settings":
      loadHtmlAndScripts("templates/settings.html");
      break;
    case "send-advanced-transaction":
      loadHtmlAndScripts("templates/advanced-transaction.html");
      break;
    case "add-to-token-list":
      loadHtmlAndScripts("templates/add-to-token-list.html");
      break;
    case "ide":
      loadHtmlAndScripts("templates/ide.html");
      break;
    case "request":
      loadHtmlAndScripts("templates/request.html");
      break;
    default:
      break;
  }
}

function insertHTMLAndExecuteScripts(container, htmlContent) {
  container.innerHTML = htmlContent;
  const scripts = container.querySelectorAll("script");

  // Identify and remove previously loaded scripts to prevent duplicates
  const oldScripts = document.querySelectorAll('script[data-script="dynamic"]');
  oldScripts.forEach(script => script.remove());

  scripts.forEach((originalScript) => {
    if (originalScript.src) {
      const script = document.createElement("script");
      script.src = originalScript.src;
      script.setAttribute('data-script', 'dynamic'); // Mark script for identification
      script.onload = () => {
        console.log(`Script loaded: ${script.src}`);
      };
      document.head.appendChild(script);
    } else {
      console.warn("Inline script execution is blocked by CSP");
    }
  });
}


document.addEventListener("DOMContentLoaded", (event) => {
  let online_status = ping();
  let online_status_element = document.getElementById("onlineStatus");
  if (!online_status) {
    online_status_element.innerHTML = "Node Status <div class='offline-circle' title='Node is Offline'></div>"
  }
  else {
    online_status_element.innerHTML = "Node Status <div class='online-circle' title='Node is Online'></div>"
  }

  Promise.all([
    readSecureCookie("publicKey"),
    readSecureCookie("encryptedPrivateKey"),
  ]).then((values) => {
  if (
    values[0] &&
    values[1] &&
    unencryptedPrivateKey != null
  ) {
    changePage("wallet");
  } else if (
    values[0] &&
    values[1] &&
    unencryptedPrivateKey == null
  ) {
    changePage("password-input");
  } else {
    changePage("get-started");
  }
  });

});