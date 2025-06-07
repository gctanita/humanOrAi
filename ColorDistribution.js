const Jimp = require('jimp');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createCanvas } = require('canvas');
const fs = require('fs');


async function analyzeColorDistribution(imagePath, bucketSize = 32) {
    const image = await Jimp.read(imagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const colorBuckets = {};

    image.scan(0, 0, width, height, function (x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];

        // Bucketizing color values
        const rBucket = Math.floor(red / bucketSize) * bucketSize;
        const gBucket = Math.floor(green / bucketSize) * bucketSize;
        const bBucket = Math.floor(blue / bucketSize) * bucketSize;

        const bucketKey = `${rBucket},${gBucket},${bBucket}`;

        if (!colorBuckets[bucketKey]) {
            colorBuckets[bucketKey] = 0;
        }
        colorBuckets[bucketKey]++;
    });

    // Convert result into sorted array (most dominant first)
    const sortedColors = Object.entries(colorBuckets)
        .sort((a, b) => b[1] - a[1])
        .map(([color, count]) => ({ color, count }));

    console.log("🎨 Dominant Color Buckets:");
    console.table(sortedColors.slice(0, 10)); // top 10

    let totalPixels = width * height;
    const sorted = Object.entries(colorBuckets)
        .sort((a, b) => b[1] - a[1])
        .map(([color, count]) => ({
            color,
            hex: rgbToHex(color),
            count,
            percentage: ((count / totalPixels) * 100).toFixed(2)
        }));

  console.table(sorted.slice(0, 10)); // Show top 10

    return sortedColors;
}

function rgbToHex(rgb) {
    const [r, g, b] = rgb.split(',').map(Number);
    return "#" + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

async function generateChart(data, outputFile = 'color_chart.png') {
    const chartCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
    const chart = await chartCanvas.renderToBuffer({
        type: 'bar',
        data: {
            labels: data.map(d => d.hex),
            datasets: [{
                label: 'Color Frequency (%)',
                data: data.map(d => d.percentage),
                backgroundColor: data.map(d => d.hex)
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Percentage' }
                }
            }
        }
    });

    fs.writeFileSync(outputFile, chart);
    console.log(`📊 Chart saved as ${outputFile}`);
}

async function generateHistogramImage(data, outputFile = 'color_histogram.png') {
    const boxSize = 40;
    const cols = 10;
    const rows = Math.ceil(data.length / cols);
    const canvas = createCanvas(cols * boxSize, rows * boxSize);
    const ctx = canvas.getContext('2d');

    data.forEach((d, i) => {
        const x = (i % cols) * boxSize;
        const y = Math.floor(i / cols) * boxSize;
        ctx.fillStyle = d.hex;
        ctx.fillRect(x, y, boxSize, boxSize);
    });

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    console.log(`🖼️ Histogram image saved as ${outputFile}`);
}

(async () => {
    console.log("🔍 Starting Color Distribution Analysis...");
    const result = await analyzeColorDistribution('portrait-photorealistic-human-01.jpg', 32);
    console.log("🎨 Color distribution analysis completed.");

    console.log("Generating chart and histogram image...");
    await generateChart(result.slice(0, 20)); // Limit to top 20 for readability
    console.log("Generating histogram image...");
    await generateHistogramImage(result); // First 50 color blocks
})();