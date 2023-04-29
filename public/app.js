// Mapping and utils.
const MAPPING = {
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  Escape: "Esc",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  UpArrow: "▲",
  DownArrow: "▼",
  LeftArrow: "◀",
  RightArrow: "▶",
  Return: "↩",
  Backspace: "←",
  Alt: "Alt",
  AltGr: "Alt",
  MetaLeft: "⊞",
  MetaRight: "⊞",
  Space: "―",
  CapsLock: "Caps",
};

const SPECIALS = [
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
  "Alt",
  "AltGr",
  "MetaLeft",
  "MetaRight",
];

const COMMONS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890".split("");

function fixKey({ name, code }) {
  const mapped = MAPPING[code];
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

function isSpecial(code) {
  return SPECIALS.includes(code);
}

// UI Handler.
const container = document.getElementById("keys");
const combination = {
  keys: [],
  element: null,
  update: null,
};
const keys = [];

function addKey(key) {
  const keyElement = document.createElement("div");
  keyElement.classList.add("key");
  keyElement.innerText = key;
  keys.push(keyElement);
  container.appendChild(keyElement);

  if (keys.length > 20) {
    keys.shift().remove();
  }

  return keyElement;
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
    if (last?.code != code) {
      combination.keys.push(key);
      combination.update();
    }
  } else {
    if (isSpecial(code)) {
      addCombination();
      combination.keys.push(key);
      combination.update();
    } else {
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
