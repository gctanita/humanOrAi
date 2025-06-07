const Jimp = require('jimp');

// Sobel kernels
const sobelX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];
const sobelY = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]
];

function applyKernel(image, x, y, kernel) {
  let value = 0;
  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x + kx, y + ky)).r;
      value += pixel * kernel[ky + 1][kx + 1];
    }
  }
  return value;
}

async function sobelEdgeDetection(path) {
  const image = await Jimp.read(path);
  const gray = image.clone().greyscale();
  const width = gray.bitmap.width;
  const height = gray.bitmap.height;
  const output = new Jimp(width, height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx = applyKernel(gray, x, y, sobelX);
      const gy = applyKernel(gray, x, y, sobelY);
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const clamped = Math.min(255, Math.max(0, magnitude));
      output.setPixelColor(Jimp.rgbaToInt(clamped, clamped, clamped, 255), x, y);
    }
  }

  await output.writeAsync('sobel_output_'+path+'.png');
  console.log('✅ Saved sobel_output_'+path+'.png');
}

const imagePaths = [
    'portrait-photorealistic-human-01.jpg',
    'portrait-photorealistic-human-02.jpg',
    'portrait-photorealistic-AI-01.png',
    'portrait-photorealistic-AI-02.png',
    'portrait-ilustrative-human-01.jpg',
    'portrait-ilustrative-human-02.jpg',
    'portrait-CGI-human-01.jpg',
    'portrait-CGI-human-02.jpg',
];

imagePaths.forEach(imagePath => {
    sobelEdgeDetection(imagePath)
        .then(() => console.log(`Edge detection completed for ${imagePath}.`))
        .catch(err => console.error(`Error during edge detection for ${imagePath}:`, err));
});

