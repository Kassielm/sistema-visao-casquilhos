const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    capturePage: (rect) => ipcRenderer.invoke("capture-page", rect),
    onTriggerCapture: (callback) => ipcRenderer.on("trigger-capture", callback),
    sendCaptureResponse: (response) => ipcRenderer.send("capture-response", response),
    onTriggerMessage: (callback) => ipcRenderer.on("message", callback),
    onTriggerStatusLora: (callback) => ipcRenderer.on("status-lora", callback)
});

window.addEventListener("DOMContentLoaded", () => {
  var replaceText = function (selector, text) {
    var element = document.getElementById(selector);
    if (element) element.innerText = text;
  };
  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
