import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import mpv from "mpv-ipc";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow, mpvProcess, mpvPlayer, currentPath;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  // Set up custom menu
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: async () => {
            mainWindow.webContents.send("load", "");
          },
        },
        {
          label: "Open Subtitle...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: "Select a Subtitle File",
              buttonLabel: "Open Subtitle",
              properties: ["openFile"],
              filters: [
                {
                  name: "Subtitle Files",
                  extensions: ["srt"],
                },
              ],
            });

            if (result.filePaths.length > 0) {
              const content = fs.readFileSync(result.filePaths[0], {
                encoding: "utf-8",
              });

              mainWindow.webContents.send("load", content);
              currentPath = result.filePaths[0];
              mainWindow.setTitle("SubsEdit - " + currentPath);
            }
          },
        },
        {
          label: "Open Video...",
          accelerator: "CmdOrCtrl+Shift+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: "Select a Video File",
              buttonLabel: "Open Video",
              properties: ["openFile"],
              filters: [
                {
                  name: "Videos",
                  extensions: ["mp4", "mkv", "avi", "mov", "flv", "wmv"],
                },
              ],
            });

            if (result.filePaths.length > 0) {
              startMpv(result.filePaths[0]);
            }
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            mainWindow.webContents.send("save");
          },
        },
        {
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: "Save File",
              defaultPath: currentPath,
              buttonLabel: "Save",
              filters: [{ name: "SRT Files", extensions: ["srt"] }],
            });

            if (!result.canceled && result.filePath) {
              currentPath = result.filePath;
              mainWindow.setTitle("SubsEdit - " + currentPath);
              mainWindow.webContents.send("save");
            }
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          role: "quit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    ...(isDev
      ? [
          {
            label: "View",
            submenu: [
              { role: "reload" },
              { role: "forceReload" },
              { type: "separator" },
              { role: "togglefullscreen" },
            ],
          },
          {
            label: "Developer",
            submenu: [
              {
                label: "Toggle Developer Tools",
                accelerator: "F12",
                click: () => mainWindow.webContents.toggleDevTools(),
              },
            ],
          },
        ]
      : []),
  ]);

  Menu.setApplicationMenu(menu);
});

function updatePosition(position) {
  if (mainWindow) {
    mainWindow.webContents.send("position", position);
  }
}

function updateDuration(duration) {
  if (mainWindow) {
    mainWindow.webContents.send("duration", duration);
  }
}

async function startMpv(videoPath) {
  if (mpvProcess || mpvPlayer) {
    if (!mpvPlayer) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (mpvPlayer) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }

    mpvPlayer.loadfile(videoPath);
    return;
  }

  mpvProcess = spawn("mpv", [videoPath, "--input-ipc-server=/tmp/mpv.sock"]);

  mpvProcess.stdout.on("data", (data) => {
    console.log(data.toString("utf8"));
  });

  mpvProcess.stderr.on("data", (data) => {
    console.error(data.toString("utf8"));
  });

  mpvProcess.stdout.once("data", () => {
    // Connect to socket.
    mpvPlayer = new mpv.MPVClient("/tmp/mpv.sock");
    mpvPlayer.observeProperty("playback-time", updatePosition);

    setInterval(async () => {
      const duration = await mpvPlayer.getProperty("duration");
      updateDuration(duration);
    }, 1000);
  });

  mpvProcess.on("close", () => {
    mpvPlayer = mpvProcess = null;
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("seek", (event, time) => {
  if (mpvPlayer) {
    mpvPlayer.seek(time, "absolute");
  }
});

ipcMain.on("save", async (event, content) => {
  fs.writeFileSync(currentPath, content, "utf-8");
});
