// (function () {
//   var div = document.createElement("div");
//   div.style.position = "absolute";
//   div.textContent = "Injected!";
//   document.body.appendChild(div);

//   var w =
//     window.innerWidth ||
//     document.documentElement.clientWidth ||
//     document.body.clientWidth;
//   div.style.right = w / 2 - 100 + "px";

//   var h =
//     window.innerHeight ||
//     document.documentElement.clientHeight ||
//     document.body.clientHeight;
//   div.style.top = h - 50 + "px";
// })();

const uuidv4 = () => {
  var result = "";
  var hexcodes = "0123456789abcdef".split("");
  for (var index = 0; index < 32; index++) {
    var value = Math.floor(Math.random() * 16);

    switch (index) {
      case 8:
        result += "-";
        break;
      case 12:
        value = 4;
        result += "-";
        break;
      case 16:
        value = (value & 3) | 8;
        result += "-";
        break;
      case 20:
        result += "-";
        break;
    }
    result += hexcodes[value];
  }
  return result;
};

interface Elements {
  id: string;
  element: HTMLElement;
}

const elements: Elements[] = [];

interface ElementText {
  id: string;
  text: string;
}

const extractElements = (): ElementText[] => {
  const pElements = document.getElementsByTagName("p");
  const pTexts = [] as ElementText[];
  for (let i = 0; i < pElements.length; i++) {
    const id = uuidv4();
    elements.push({ id: id, element: pElements[i] });
    if (pElements[i].innerText) {
      pTexts.push({ id: id, text: pElements[i].innerText });
    }
  }
  return pTexts;
};

function scrollToTargetAdjusted(element: HTMLElement) {
  var h =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  var elementPosition = element.getBoundingClientRect().top;
  var offsetPosition = elementPosition + window.scrollY - h / 2;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.command === "getElements") {
    const elements = extractElements();
    sendResponse(elements);
  }
  if (msg.command === "focusElement") {
    const element = elements.find((e) => e.id === msg.value);
    if (element) {
      scrollToTargetAdjusted(element.element);
      // element.element.scrollIntoView({ block: "start", behavior: "smooth" });
      // element.element.focus();
    }
  }
});
