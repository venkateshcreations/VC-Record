const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true,
    },
  });

  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 512px; height: 512px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
          svg { width: 512px; height: 512px; }
        </style>
      </head>
      <body>${svgContent}</body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Wait for rendering
  await new Promise((r) => setTimeout(r, 600));

  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const pngBuffer = image.toPNG();

  const publicPng = path.join(__dirname, '../public/icon.png');
  const distPng = path.join(__dirname, '../dist/icon.png');
  fs.writeFileSync(publicPng, pngBuffer);
  try {
    fs.writeFileSync(distPng, pngBuffer);
  } catch (e) {}

  console.log('PNG icon generated successfully:', publicPng);

  // Convert to multi-resolution ICO via Python Pillow
  const pyScript = `
import sys
from PIL import Image

png_path = r'${publicPng.replace(/\\/g, '/')}'
ico_path = r'${path.join(__dirname, '../public/icon.ico').replace(/\\/g, '/')}'
dist_ico = r'${path.join(__dirname, '../dist/icon.ico').replace(/\\/g, '/')}'

img = Image.open(png_path)
icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
img.save(ico_path, format='ICO', sizes=icon_sizes)
try:
    img.save(dist_ico, format='ICO', sizes=icon_sizes)
except Exception:
    pass
print('ICO icon generated successfully with sizes:', icon_sizes)
`;
  execSync(`python -c "${pyScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });

  app.quit();
});
