// Lottie player instance
let animation = null;
let lottieJson = null;
let currentBackgroundColor = '#FFFFFF'; // Default background color
let currentSpeedMultiplier = 1; // Default speed
let currentCanvasWidth = 400; // Default canvas width
let currentCanvasHeight = 400; // Default canvas height

// Handle file upload
document.getElementById('upload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    lottieJson = JSON.parse(e.target.result);

    // Apply background color if it's in the JSON
    if (lottieJson.bgColor) {
      currentBackgroundColor = lottieJson.bgColor;
      document.getElementById('backgroundColor').value = currentBackgroundColor;
      document.getElementById('lottieContainer').style.backgroundColor =
        currentBackgroundColor;
    }

    // Apply speed if it's in the JSON
    if (lottieJson.speedMultiplier) {
      currentSpeedMultiplier = lottieJson.speedMultiplier;
      document.getElementById('speedControl').value = currentSpeedMultiplier;
    }

    // Apply canvas size if it's in the JSON
    if (lottieJson.canvasWidth && lottieJson.canvasHeight) {
      currentCanvasWidth = lottieJson.canvasWidth;
      currentCanvasHeight = lottieJson.canvasHeight;
      document.getElementById('canvasWidth').value = currentCanvasWidth;
      document.getElementById('canvasHeight').value = currentCanvasHeight;
      setCanvasSize(currentCanvasWidth, currentCanvasHeight);
    }

    loadLottieAnimation(lottieJson);
    parseColorsFromJson(lottieJson);
  };

  reader.readAsText(file);
});

// Function to load Lottie Animation
function loadLottieAnimation(jsonData) {
  if (animation) {
    animation.destroy();
  }

  animation = lottie.loadAnimation({
    container: document.getElementById('lottieContainer'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: jsonData
  });

  // Apply speed from current speed multiplier
  animation.setSpeed(currentSpeedMultiplier);
}

// Handle background color change
document.getElementById('backgroundColor').addEventListener('input', function (event) {
  currentBackgroundColor = event.target.value;
  document.getElementById('lottieContainer').style.backgroundColor = currentBackgroundColor;
});

// Handle canvas size change
document.getElementById('canvasWidth').addEventListener('input', function (event) {
  currentCanvasWidth = event.target.value;
  setCanvasSize(currentCanvasWidth, currentCanvasHeight);
});

document.getElementById('canvasHeight').addEventListener('input', function (event) {
  currentCanvasHeight = event.target.value;
  setCanvasSize(currentCanvasWidth, currentCanvasHeight);
});

// Function to set the size of the canvas
function setCanvasSize(width, height) {
  const lottieContainer = document.getElementById('lottieContainer');
  lottieContainer.style.width = `${width}px`;
  lottieContainer.style.height = `${height}px`;
}

// Handle animation speed (duration) change
document.getElementById('speedControl').addEventListener('input', function (event) {
  currentSpeedMultiplier = event.target.value;
  animation.setSpeed(currentSpeedMultiplier);
});

// Function to parse colors from Lottie JSON
function parseColorsFromJson(jsonData) {
  const colorInputs = document.getElementById('colorInputs');
  colorInputs.innerHTML = ''; // Clear existing inputs

  let colorCount = 0;

  // Traverse the layers and extract colors
  jsonData.layers.forEach((layer, layerIndex) => {
    if (layer.shapes) {
      layer.shapes.forEach((shape, shapeIndex) => {
        if (shape.it) {
          shape.it.forEach((item, itemIndex) => {
            if (item.c) { // c is the color property in Lottie JSON
              const colorArray = item.c.k;

              // Convert array to hex color
              const hexColor = rgbToHex(colorArray[0] * 255, colorArray[1] * 255,
                colorArray[2] * 255);

              // Create color input
              const colorInput = document.createElement('input');
              colorInput.type = 'color';
              colorInput.value = hexColor;
              colorInput.dataset.layerIndex = layerIndex;
              colorInput.dataset.shapeIndex = shapeIndex;
              colorInput.dataset.itemIndex = itemIndex;

              colorInput.addEventListener('input', function (e) {
                updateLottieColor(e.target);
              });

              colorInputs.appendChild(colorInput);
              colorCount++;
            }
          });
        }
      });
    }
  });

  if (colorCount > 0) {
    document.getElementById('colorEditor').style.display = 'block';
    document.getElementById('downloadJson').style.display = 'inline';
  }
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Convert HEX to RGB
function hexToRgb(hex) {
  var bigint = parseInt(hex.substring(1), 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}

// Function to update Lottie color
function updateLottieColor(input) {
  const layerIndex = input.dataset.layerIndex;
  const shapeIndex = input.dataset.shapeIndex;
  const itemIndex = input.dataset.itemIndex;

  const newColor = hexToRgb(input.value);

  // Update the JSON with new color
  lottieJson.layers[layerIndex].shapes[shapeIndex].it[itemIndex].c.k = newColor;

  // Re-render the animation with the updated colors
  loadLottieAnimation(lottieJson);
}

// Download updated JSON
document.getElementById('downloadJson').addEventListener('click', function () {
  // Add the custom properties to the JSON before downloading
  lottieJson.bgColor = currentBackgroundColor;
  lottieJson.speedMultiplier = currentSpeedMultiplier;
  lottieJson.canvasWidth = currentCanvasWidth;
  lottieJson.canvasHeight = currentCanvasHeight;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(
    lottieJson));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'updated_lottie.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
});
