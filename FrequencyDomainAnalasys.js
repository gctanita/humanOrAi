// Frequency Domain Analysis of an Image using FFT
// This script performs frequency domain analysis on an image using Fast Fourier Transform (FFT).
// It reads an image, converts it to grayscale, applies FFT, and logs the frequency magnitude spectrum.
// Usage: node FrequencyDomainAnalysis.js
// Ensure you have the required packages installed:
// npm install jimp@0.22.10


const Jimp = require('jimp');
const  ndarray = require('ndarray');
const  fft = require('ndarray-fft');


let width;
let height;

// Load image and convert to grayscale matrix
async function loadImageAsGrayscaleMatrix(imagePath) {
    const image = await Jimp.read(imagePath);
    width = image.bitmap.width;
    height = image.bitmap.height;

    const real = ndarray(new Float32Array(width * height), [height, width]);
    const imag = ndarray(new Float32Array(width * height), [height, width]);

    image.grayscale(); // convert to grayscale

    image.scan(0, 0, width, height, function (x, y, idx) {
        const pixel = this.bitmap.data[idx]; // red channel (gray, so red=green=blue)
        real.set(y, x, pixel); // FFT expects real and imaginary parts
        imag.set(y, x, 0);     // start with imaginary = 0
    });

    return { real, imag };
}

// Perform FFT and log power spectrum
function analyzeFrequency(real, imag) {
    fft(1, real, imag); // forward FFT

    const width = real.shape[1];
    const height = real.shape[0];
    const magnitude = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const re = real.get(y, x);
            const im = imag.get(y, x);
            const mag = Math.sqrt(re * re + im * im);
            magnitude.push(mag);
        }
    }

    return magnitude;
}
function reshapeTo2D(magnitude, width, height) {
    const matrix = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(magnitude[y * width + x]);
        }
        matrix.push(row);
    }
    return matrix;
}

function fftShift(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    //   const shifted = Array.from({ length: h }, () => Array(w).fill(0));
    const shifted = [];
    for (let y = 0; y < h; y++) {
        shifted[y] = [];
        for (let x = 0; x < w; x++) {
            shifted[y][x] = 0; // initialize with zeros
        }
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const newY = (y + Math.floor(h / 2)) % h;
            const newX = (x + Math.floor(w / 2)) % w;

           // console.log(`Shifting pixel (${y}, ${x}) to (${newY}, ${newX})`);
            shifted[newY][newX] = matrix[y][x];
        }
    }

    return shifted;
}

function analyzeSpectrum(matrix) {
    let total = 0;
    let count = 0;
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;

    const h = matrix.length;
    const w = matrix[0].length;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dist = Math.sqrt(Math.pow(y - h / 2, 2) + Math.pow(x - w / 2, 2));
            const value = matrix[y][x];
            total += value;
            count++;

            // Arbitrary threshold to separate low and high frequencies
            if (dist < Math.min(h, w) / 4) {
                lowFreqEnergy += value;
            } else {
                highFreqEnergy += value;
            };
        }
    }

    const avg = total / count;
    const freqRatio = highFreqEnergy / (lowFreqEnergy + 1e-6); // avoid division by 0

    return {
        averageMagnitude: avg,
        highToLowFreqRatio: freqRatio,
        dominantFreqZone: freqRatio > 1 ? 'High Frequencies' : 'Low Frequencies',
    };
}

function getStats(arr) {
    if (!arr.length) { 
        return null;
    }

    // Sort for median calculation
    const sorted = [...arr].sort((a, b) => a - b);

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (const val of arr) {
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
    }
    const avg = sum / arr.length;

    let median;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        median = (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
        median = sorted[mid];
    }

    return {
        min,
        max,
        average: avg,
        median,
    };
}

// Run the analysis
(async () => {
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

    console.log("🔍 Starting Frequency Domain Analysis on multiple images...");
    
    console.log("Image Path".padEnd(50, ' '), "|", "Min Magnitude".padEnd(20, ' '), "|", "Max Magnitude".padEnd(20, ' '), "|", "Average Magnitude".padEnd(20, ' '), "|", "Median Magnitude".padEnd(20, ' '), "|", "High/Low Frequency Ratio".padEnd(25, ' '), "|", "Dominant Frequency Zone".padEnd(20, ' '));
    console.log("-".repeat(200));
    
    for (const imagePath of imagePaths) {

        const { real, imag } = await loadImageAsGrayscaleMatrix(imagePath);
        const magnitude = analyzeFrequency(real, imag);

        const stats = getStats(magnitude);
        if (magnitude.length !== width * height) {
            console.error("⚠️ Error: Magnitude length does not match image dimensions.");
            continue;
        }
        const magnitude2D = reshapeTo2D(magnitude, width, height);
        const shiftedMagnitude = fftShift(magnitude2D);
        const logMagnitude = shiftedMagnitude.map(row =>
            row.map(value => Math.log(1 + value))
        );
    
        const features = analyzeSpectrum(logMagnitude);
        
        const allStats = {
            imagePath,

            averageMagnitude: stats.average.toFixed(2),
            minMagnitude: stats.min.toFixed(2),
            maxMagnitude: stats.max.toFixed(2),
            medianMagnitude: stats.median.toFixed(2),
            highToLowFreqRatio: features.highToLowFreqRatio.toFixed(2),
            dominantFreqZone: features.dominantFreqZone,
        }

        console.log(`${allStats.imagePath.padEnd(50, ' ')} | ${allStats.minMagnitude.padEnd(20, ' ')} | ${allStats.maxMagnitude.padEnd(20, ' ')} | ${allStats.averageMagnitude.padEnd(20, ' ')} | ${allStats.medianMagnitude.padEnd(20, ' ')} | ${allStats.highToLowFreqRatio.padEnd(25, ' ')} | ${allStats.dominantFreqZone.padEnd(20, ' ')}`);
    }
})();

