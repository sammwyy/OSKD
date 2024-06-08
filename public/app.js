// HTML References.
const container = document.getElementById("keys");

// Config provider.
let config = {
  options: {
    doNotRepeatLastKey: false,
    printOnlyCombinations: false,
    rowLayout: "",
  },
  modifiersKeys: [],
  keyMapping: {},
  keyStyle: {},
};

function setConfig(newConfig) {
  config = newConfig;
  container.classList.add(config.options.rowLayout);
}

fetch("/config.json")
  .then((res) => res.json())
  .then(setConfig);

// Mapping and utils.
const COMMONS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890".split("");

function fixKey({ name, code }) {
  const mapped = config.keyMapping[code];
  if (mapped) {
    return mapped;
  } else if (name) {
    return name;
  } else if (code.startsWith("Key")) {
    return code.split("Key")[1];
  } else {
    return code;
  }
}

function isCommon(key) {
  return COMMONS.includes(fixKey(key));
}

function isModifierKey(code) {
  return config.modifiersKeys.includes(code);
}

// UI Handler.
const combination = {
  keys: [],
  element: null,
  update: null,
};
const keys = [];

function addKey(key) {
  const keyElement = document.createElement("div");
  keyElement.classList.add("key");
  applyConfigStyling(keyElement);
  keyElement.innerText = key;
  keys.push(keyElement);
  container.appendChild(keyElement);

  if (keys.length > 20) {
    keys.shift().remove();
  }

  return keyElement;
}

function applyConfigStyling(element) {
  applyStyleConfig(element, "fontSize");
  applyStyleConfig(element, "textColor", "color");
  applyStyleConfig(element, "backgroundColor");
  applyStyleConfig(element, "borderRadius");
}

function applyStyleConfig(element, configKey, styleName = configKey) {
  const cfg = config["keyStyle"][configKey];
  if (cfg) {
    element.style[styleName] = cfg;
  }
}

function addCombination() {
  const element = addKey("");
  combination.keys = [];
  combination.element = element;
  combination.update = () => {
    element.innerText = combination.keys
      .map((key) => fixKey({ code: key.code }))
      .join(" + ");
  };
}

function onKeyPress(name, code) {
  const key = { name, code };

  if (combination.element) {
    const last = combination.keys[combination.keys.length - 1];

    if (config.options.doNotRepeatLastKey && last?.code == code) {
      return;
    }

    combination.keys.push(key);
    combination.update();
  } else {
    if (isModifierKey(code)) {
      addCombination();
      combination.keys.push(key);
      combination.update();
    } else if (config.options.printOnlyCombinations) {
      addKey(fixKey(key));
    }
  }
}

function onKeyRelease(code) {
  if (combination.element) {
    const first = combination.keys[0];
    if (first.code == code) {
      combination.element = null;
    }
  }
}

// Socket connection.
const socket = io();

socket.on("connect", () => {
  console.log("Connected socket to backend.");
});

socket.on("input", (packet) => {
  const { name, event_type } = JSON.parse(packet);
  const event = Object.keys(event_type)[0];
  const data = event_type[event];

  if (event == "KeyPress") {
    onKeyPress(name, data);
  } else if (event == "KeyRelease") {
    onKeyRelease(data);
  }
});
