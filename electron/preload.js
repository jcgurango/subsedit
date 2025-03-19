const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, callback) => {
    const subscription = (_, data) => callback(data);
    ipcRenderer.on(channel, subscription);

    // Return an unsubscribe function
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});
