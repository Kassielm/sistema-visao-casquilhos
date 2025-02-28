const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    capturePage: (rect) => ipcRenderer.invoke("capture-page", rect),
    onTriggerCapture: (callback) => ipcRenderer.on("trigger-capture", callback),
    sendCaptureResponse: (response) => ipcRenderer.send("capture-response", response)
});
