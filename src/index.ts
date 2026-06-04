// -nocheck
var _onscroll = function () {
  var scrollY = window.pageYOffset;
  var innerHeight = window.innerHeight;
  var splashIframe = document.getElementById("splash_iframe");
  if (
    !(splashIframe instanceof HTMLIFrameElement) ||
    !splashIframe.contentWindow
  )
    return;
  splashIframe.contentWindow.postMessage(
    {
      isOnScreen: scrollY < 400,
    },
    "*",
  );
};
window.addEventListener("scroll", _onscroll, false);
setTimeout(_onscroll, 1000);
setTimeout(_onscroll, 5000);
setTimeout(_onscroll, 10000);
