// This script calculates the Average Patch Variance (APV) of an image.
// It reads an image, converts it to grayscale, divides it into patches,
// computes the variance of pixel values in each patch, and then calculates
// the average of these variances. The result is printed to the console.
// Usage: node avp-check.js
//
// Ensure you have the required packages installed:
// npm install mathjs
// npm install jimp@0.22.10

const Jimp = require('jimp');
const { variance } = require("mathjs");

// const PATCH_SIZE = 20;

async function calculateAPV(imagePath, PATCH_SIZE = 20) {
  const img = await Jimp.read(imagePath);
  img.grayscale();

  const width = img.bitmap.width;
  const height = img.bitmap.height;

  const patchVariances = [];

  for (let y = 0; y < height; y += PATCH_SIZE) {
    for (let x = 0; x < width; x += PATCH_SIZE) {
      const patchPixels = [];

      for (let j = 0; j < PATCH_SIZE && y + j < height; j++) {
        for (let i = 0; i < PATCH_SIZE && x + i < width; i++) {
          const idx = (x + i) + (y + j) * width;
          const pixel = img.bitmap.data[idx * 4]; // grayscale → R == G == B
          patchPixels.push(pixel);
        }
      }

      if (patchPixels.length > 0) {
        patchVariances.push(variance(patchPixels));
      }
    }
  }

  const apv = patchVariances.reduce((a, b) => a + b, 0) / patchVariances.length;
   return apv.toFixed(2);
}

async function prettyPrintAPV(imagePath) {
    let patchSize8 = await calculateAPV(imagePath, 8);
    let patchSize16 = await calculateAPV(imagePath, 16);
    let patchSize32 = await calculateAPV(imagePath, 32);
    let patchSize64 = await calculateAPV(imagePath, 64);

    let paddedStr = imagePath.padEnd(50, ' ');
    console.log(`${paddedStr}: \t${patchSize8.padEnd(10,' ')} \t ${patchSize16.padEnd(10,' ')} \t ${patchSize32.padEnd(10,' ')} \t ${patchSize64.padEnd(10,' ')}`);
}

(async () => {
    console.log("Starting APV calculations...");
    console.log("\n\n");
    
    console.log("PORTRAIT IMAGES");
    console.log("-".repeat(120));
    console.log("Image Path - Photorealistic".padEnd(50, ' '), "\tAPV (8px)", "\t APV (16px)", "\t APV (32px)", "\t APV (64px)");
    console.log("-".repeat(120));
    await prettyPrintAPV("portrait-photorealistic-human-01.jpg");
    await prettyPrintAPV("portrait-photorealistic-human-02.jpg");
    await prettyPrintAPV("portrait-photorealistic-human-03.jpg");
    await prettyPrintAPV("portrait-photorealistic-AI-01.png");
    await prettyPrintAPV("portrait-photorealistic-AI-02.png");

    
    console.log("\n\n");
    console.log("CGI IMAGES");
    console.log("-".repeat(120));
    console.log("Image Path - CGI".padEnd(50, ' '), "\tAPV (8px)", "\t APV (16px)", "\t APV (32px)", "\t APV (64px)");
    console.log("-".repeat(120));
    await prettyPrintAPV("portrait-CGI-human-01.jpg");
    await prettyPrintAPV("portrait-CGI-human-02.jpg");
    await prettyPrintAPV("portrait-CGI-human-03.jpg");

    console.log("\n\n");
    console.log("ILLUSTRATIVE IMAGES");
    console.log("-".repeat(120));
    console.log("Image Path - Illustrative".padEnd(50, ' '), "\tAPV (8px)", "\t APV (16px)", "\t APV (32px)", "\t APV (64px)");
    console.log("-".repeat(120));
    await prettyPrintAPV("portrait-ilustrative-human-01.jpg");
    await prettyPrintAPV("portrait-ilustrative-human-02.jpg");
    await prettyPrintAPV("portrait-ilustrative-human-03.jpg");
    // await prettyPrintAPV("portrait-ilustrative-AI-01.png");
    // await prettyPrintAPV("portrait-ilustrative-AI-02.png");


    console.log("\n\n");
    console.log("APV calculations completed.");



// Uncomment the following block to calculate APV for all patches from 1 to 255
    // console.log("Calculating APV for all patches from 1 to 255...");
    // let data = [];
    // for (let i = 1; i < 256; i++) {
    //           data.push({
    //             patch: i,
    //             apv: await calculateAPV("portrait-photorealistic-AI-02.png", i)
    //           });
    // }
    // data.sort((a, b) => a.apv - b.apv);
    // data.forEach(item => {
    //     console.log(`avp: ${item.apv}, patch: ${item.patch}`);
    // });
})();
