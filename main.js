/* jshint esversion: 6 */

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *           GLOBAL VARIABLES
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

const PAD = 20;
var panelsAreHidden = true;
var panelsAreHidden2 = true;

// helper: format any displayed number to 3 significant figures
// Format number with up to 'sig' significant digits but never use scientific notation
function formatSigFig(num, sig = 3) {
  if (num === null || typeof num === 'undefined' || isNaN(Number(num))) return '';

  num = Number(num);

  // Handle zero separately
  if (num === 0) return '0';

  // Calculate order of magnitude (base 10 exponent)
  const order = Math.floor(Math.log10(Math.abs(num)));

  // If order >= sig - 1, show as integer with no decimals
  if (order >= sig - 1) {
    return num.toFixed(0);
  }

  // Else calculate decimals to keep 'sig' significant digits
  const decimals = sig - 1 - order;

  // Use toFixed with decimals, then trim trailing zeros
  let str = num.toFixed(decimals);

  // Remove trailing zeros and optional decimal point
  str = str.replace(/\.?0+$/, '');

  return str;
}

function formatTimeWithSigFig(seconds, sig = 3) {
  if (seconds <= 0 || isNaN(seconds)) return "0 s";

  const daySec = 86400;
  const hourSec = 3600;
  const minSec = 60;

  let value, unit;

  if (seconds >= daySec) {
    value = seconds / daySec;
    unit = "days";
  } else if (seconds >= hourSec) {
    value = seconds / hourSec;
    unit = "h";
  } else if (seconds >= minSec) {
    value = seconds / minSec;
    unit = "min";
  } else {
    value = seconds;
    unit = "s";
  }

  // Format value to sig figs without scientific notation
  let formatted = Number.parseFloat(value).toPrecision(sig);
  
  // Remove trailing zeros and possible decimal point if integer
  formatted = formatted.replace(/\.?0+$/, '');

  return `${formatted} ${unit}`;
}


const canvasWidthMargin = 250;  // reserved width for side panels (used in clientWidth calc)
const canvasHeight = 500;

let clientWidth = Math.max(400, window.innerWidth - canvasWidthMargin);
let clientHeight = canvasHeight;

// === Layout Position Variables ===
const mainGuiTop = 0;
const mainGuiLeft = 0;
const mainGuiWidth = clientWidth;  // dynamic width of main GUI panel

const secondaryGuiTopOffset = 320;  // vertical offset for secondary GUI (gui2)
const secondaryGuiLeft = 0;
const secondaryGuiWidth = clientWidth; // same width as main GUI by default

const resultsPanelWidth = 320;          // approx width of Results panel
const resultsPanelLeft = 10;            // margin from left edge
const resultsPanelTopOffset = canvasHeight + 10; // just below canvas

// PRODUCT PANEL layout variables
const productPanelLeftMargin = 10;      
const productPanelTopOffset = resultsPanelTopOffset + 100;  // below results panel with spacing
const productPanelWidth = 200;          
const productPanelHeight = 250;         

// Margins and spacing
const panelHorizontalSpacing = 10;      
const panelVerticalSpacing = 10;        

// GUI setup
let gui;
let gui2;
let textGui;
let productGui;
let wtGui;

// Variables for Calculations
let Conc = 50;
let Absorb = 510;
let Intensity = 10;
let Depth = 500;
let Wavelength = 405;
let QY = 0.55;

// Graphing Function Prep
let attPlot;
let equation;
let AttenuationFunction;  // Make sure this is global so mouseMoved and draw can access it

// Variables for numerical outputs
let A10 = 0;
let A20 = 0;
let ESh = 0;
let ESm = 0;
let ESs = 0;
let MDh = 0;
let MDm = 0;
let MDs = 0;

// Cursor tracking
let cursorXVal = null;
let cursorYVal = null;
// Snapped cursor
let snapX = null;
let snapY = null;

// === NEW VARIABLES for Product Calculation ===
let productAbsorbance = 0.5;         
let productConcentration = 2.26;     
let productThickness = 1;            
let productValue = 0;

// Attenuation function
function attenuationAt(x) {
  return Intensity * Math.exp(-1 * Absorb * Conc / 1e7 * x);
}

function updateEquations() {
  // use formatted numbers in the equation string so displayed equation also matches 3 sig figs
  equation = `${formatSigFig(Intensity, 3)} * e^(-1 * ${formatSigFig(Absorb, 3)} * ${formatSigFig(Conc, 3)} / 10^7 * x)`;
}


// ProductSlider without plus/minus buttons
class ProductSlider {
  constructor(key, min, max, init, step, label, units) {
    this.min = min;
    this.max = max;
    this.step = step;
    this.label = label;
    this.units = units;
    this.val = init;

    this.div = document.createElement("div");
    this.div.className = "qs_container";

    this.labelDiv = document.createElement("div");
    this.labelDiv.className = "qs_label";
    this.labelDiv.innerHTML = `<b>${label}:</b> `;

    this.valBox = document.createElement("input");
    this.valBox.type = "text";
    this.valBox.id = key + "-value-box";
    this.valBox.style.width = "60px";

    // show init with 3 sig figs
    this.valBox.value = formatSigFig(init, 3);

    this.labelDiv.appendChild(this.valBox);
    this.labelDiv.append(` ${units}`);

    this.div.appendChild(this.labelDiv);

    this.sliderDiv = document.createElement("input");
    this.sliderDiv.type = "range";
    this.sliderDiv.min = min;
    this.sliderDiv.max = max;
    this.sliderDiv.step = step;
    this.sliderDiv.value = init;
    this.sliderDiv.style.width = "160px";

    this.div.appendChild(this.sliderDiv);

    this.callback = null;

    this.addEventListeners();
  }

  addEventListeners = () => {
    this.sliderDiv.addEventListener("input", (event) => {
      this.val = Number(event.target.value);
      this.onUpdate();
    });

    this.valBox.addEventListener("input", (e) => {
      const str = e.target.value;
      if (str === '' || str === '-' || str === '.' || str === '-.') return;

      const num = Number(str);
      if (!isNaN(num)) {
        this.val = num;
        this.onUpdate(false);
      }
    });

    this.valBox.addEventListener("blur", () => {
      const val = this.valBox.value.trim();
      const num = Number(val);
      const validDecimalRegex = /^[-+]?\d*\.?\d+$/;

      if (val === '' || isNaN(num) || !validDecimalRegex.test(val)) {
        alert('Please enter a valid decimal number.');
        this.valBox.value = formatSigFig(this.val, 3);
        this.valBox.focus();
      } else {
        this.val = num;
        this.onUpdate(true);
      }
    });
  }

  onUpdate = (round = true) => {
    let sliderVal = this.val;
    if (sliderVal < this.min) sliderVal = this.min;
    if (sliderVal > this.max) sliderVal = this.max;
    this.sliderDiv.value = `${sliderVal}`;

    if (round) {
      this.valBox.value = formatSigFig(this.val, 3);
    }

    if (this.callback) this.callback(this.val);

    if (typeof loop === "function") loop();
  }

  setCallback = (callback) => {
    this.callback = callback;
  }

  attachParent = (parent) => {
    parent.appendChild(this.div);
  }
}

// Half-life Text Box Setup
const hlLabel = document.createElement("div");

function initHalfLifeText(parent) {
  const hlDiv = document.createElement("div");
  hlDiv.id = `hl-container`;
  hlDiv.className = "qs_container";
  parent.appendChild(hlDiv);

  hlLabel.id = `hl-label`;
  hlLabel.className = "qs_label";
  hlDiv.appendChild(hlLabel);
}

function updateHalfLifeText() {
  hlLabel.innerHTML = `
<p>
  @ exposed surface: ${ESh}<br>
  @ maximum depth: ${MDh} 
</p>
  `;
}


// Helper function for clean panel positioning
function setPanelPosition(guiObject, left, top) {
  guiObject.prototype.setPosition(left, top);
  guiObject.prototype._panel.style.left = left + 'px';
  guiObject.prototype._panel.style.top = top + 'px';
}

function windowResized() {
  clientWidth = Math.max(600, window.innerWidth - canvasWidthMargin);
  clientHeight = window.innerHeight - 200;

  // Enforce a 4/3 Aspect Ratio
  const asp = 4 / 3;
  clientHeight = Math.min(clientHeight, clientWidth / asp - 200);
  clientWidth = clientHeight * asp;

  resizeCanvas(clientWidth, clientHeight);
  attPlot.GPLOT.setOuterDim(clientWidth, clientHeight);
  attPlot.GPLOT.setPos(0, 0);

  const base = document.getElementById("plot-wrapper").getBoundingClientRect();
  const right = base.right + PAD;
  const left = base.left - PAD;
  const top = PAD;

  gui.prototype.setPosition(right, top);
  gui2.prototype.setPosition(right, secondaryGuiTopOffset + top);

  setPanelPosition(textGui, left+80, base.bottom);
  setPanelPosition(productGui, left - productPanelWidth, top);
  setPanelPosition(wtGui, left - productPanelWidth, top + productPanelHeight + PAD);
}



function setup() {
  const cnv = createCanvas(clientWidth, clientHeight);
  cnv.parent(document.getElementById("plot-wrapper"))

  initPlot();
  initMainGUI();
  initSecondaryGUI();
  initHalfLifeGUI();
  initProductGUI();
  initWtToMMGUI();

  updateEquations();

  AttenuationFunction = new Plot(equation, "x", 0, Depth);
  AttenuationFunction.lineThickness = 1; //for reference tuning margins
  attPlot.addFuncs(AttenuationFunction);
  windowResized();
  togglePanels(true);
  togglePanels2(true);

  // Event listener for button
  document.getElementById("calc-btn").addEventListener("click", () => {
    panelsAreHidden = !panelsAreHidden;
    togglePanels(panelsAreHidden);
  });

  // Event listener for half-life button
  document.getElementById("half-btn").addEventListener("click", () => {
    panelsAreHidden2 = !panelsAreHidden2;
    togglePanels2(panelsAreHidden2);
  });
}

function initPlot() {
  attPlot = new PlotCanvas(this);
  attPlot.plotSetup();

  // Set explicit base margins (you can adjust these values)
  //attPlot.GPLOT.mar = [60, 60, 50, 50]; // left, right, top, bottom

  attPlot.GPLOT.getXAxis().getAxisLabel().setText("Depth (\u03BCm)");
  attPlot.GPLOT.getYAxis().getAxisLabel().setText("Intensity (mW/cm\u00B2)");
  attPlot.GPLOT.getTitle().setText("Attenuation due to one absorber");

  attPlot.GPLOT.getXAxis().getAxisLabel().setFontSize(16);
  attPlot.GPLOT.getYAxis().getAxisLabel().setFontSize(16);

  attPlot.GPLOT.getXAxis().setFontSize(16);
  attPlot.GPLOT.getYAxis().setFontSize(16);

  attPlot.GPLOT.getTitle().setFontSize(16);

  attPlot.GPLOT.setFontSize(16);
}


function initMainGUI() {
  gui = createGui('Plot controls', clientWidth, attPlot.GPLOT.mar[2]);
  const parent = gui.prototype._panel;

  const sliders = [
    new ProductSlider('Conc', 0, 1000, Conc, 0.1, 'Absorber concentration', 'mM'),
    new ProductSlider('Absorb', 0, 5000, Absorb, 0.1, 'Napierian absorptivity', 'L/mol-cm'),
    new ProductSlider('Intensity', 0, 100, Intensity, 0.01, 'Incident intensity', 'mW/cm\u00B2'),
    new ProductSlider('Depth', 15, 2000, Depth, 1, 'Depth', '\u03BCm')
  ];

  const callbacks = [
    (val) => Conc = val,
    (val) => Absorb = val,
    (val) => Intensity = val,
    (val) => Depth = val
  ];

  sliders.forEach((slider, i) => {
    slider.attachParent(parent);
    slider.setCallback(callbacks[i]);
  });
  
  setPanelPosition(gui, window.innerWidth - gui.prototype._panel.offsetWidth - PAD, attPlot.GPLOT.mar[2]);
}

function initSecondaryGUI() {
  gui2 = createGui('Additional variables for half-life', clientWidth, secondaryGuiTopOffset + attPlot.GPLOT.mar[2]);
  const gui2parent = gui2.prototype._panel;

  const laSlider = new ProductSlider('Wavelength', 200, 600, Wavelength, 0.1, 'Wavelength', 'nm');
  laSlider.attachParent(gui2parent);
  laSlider.setCallback((val) => Wavelength = val);

  const qySlider = new ProductSlider('QY', 0, 1, QY, 0.001, 'Quantum yield', '');
  qySlider.attachParent(gui2parent);
  qySlider.setCallback((val) => QY = val);
}

function initHalfLifeGUI() {
  textGui = createGui('Initiator half-life', resultsPanelLeft, resultsPanelTopOffset+10000);
  textGui.prototype._panel.className = "qs_main text-gui";
  initHalfLifeText(textGui.prototype._panel);
}

function initProductGUI() {
  productGui = createGui('Napierian absorptivity', productPanelLeftMargin, productPanelTopOffset);
  const parent = productGui.prototype._panel;

  const sliders = [
    new ProductSlider('prodAbsorb', 0, 3, productAbsorbance, 0.001, 'Absorbance', ''),
    new ProductSlider('prodConc', 0, 500, productConcentration, 0.01, 'Concentration absorber', 'mM'),
    new ProductSlider('prodPathLength', 0, 5, productThickness, 0.001, 'Path length', 'cm')
  ];

  sliders.forEach(slider => slider.attachParent(parent));

  const resultDiv = document.createElement('div');
  Object.assign(resultDiv.style, {
    marginTop: '10px',
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
    flexBasis: '100%'
  });
  parent.appendChild(resultDiv);

  function updateProductValue() {
    if (productConcentration === 0) {
      resultDiv.textContent = 'Concentration cannot be zero';
      return;
    }
    const value = Math.log(10) * productAbsorbance / productThickness / productConcentration * 1e3;
    resultDiv.innerHTML = `
      <div style="font-weight:bold;">Napierian absorptivity:</div>
      <div>${formatSigFig(value, 3)} L/mol-cm</div>
    `;
    loop();
  }

  sliders[0].setCallback(val => { productAbsorbance = val; updateProductValue(); });
  sliders[1].setCallback(val => { productConcentration = val; updateProductValue(); });
  sliders[2].setCallback(val => { productThickness = val; updateProductValue(); });

  updateProductValue();
}

function initWtToMMGUI() {
  const newGuiLeft = productPanelLeftMargin + productPanelWidth + panelHorizontalSpacing;
  wtGui = createGui('wt% to mM conversion', newGuiLeft, productPanelTopOffset);
  const parent = wtGui.prototype._panel;

  let concNew = 0.1, dNew = 0.786, MWNew = 348.37;

  const sliders = [
    new ProductSlider('conc_wt', 0, 10, concNew, 0.001, 'Concentration absorber', 'wt%'),
    new ProductSlider('density', 0, 2, dNew, 0.001, 'Density', 'g/mL'),
    new ProductSlider('mol_weight', 0, 1000, MWNew, 0.01, 'Absorber molecular weight', 'g/mol')
  ];
  sliders.forEach(slider => slider.attachParent(parent));

  const outputDiv = document.createElement('div');
  Object.assign(outputDiv.style, {
    marginTop: '10px',
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
    flexBasis: '100%'
  });
  parent.appendChild(outputDiv);

  function updateConcentration() {
    if (MWNew === 0) {
      outputDiv.textContent = 'Molecular weight cannot be zero';
      return;
    }
    const concentration_mM = (concNew * dNew / MWNew) * 1e4;
    outputDiv.innerHTML = `
      <div style="font-weight:bold;">Concentration:</div>
      <div>${formatSigFig(concentration_mM, 3)} mM</div>
    `;
    loop();
  }

  sliders[0].setCallback(val => { concNew = val; updateConcentration(); });
  sliders[1].setCallback(val => { dNew = val; updateConcentration(); });
  sliders[2].setCallback(val => { MWNew = val; updateConcentration(); });

  updateConcentration();
}

function mouseMoved() {
  if (!attPlot || !AttenuationFunction) return;

  const mar = attPlot.GPLOT.mar;
  const marginLeft = mar[0] + 10;
  const marginRight = mar[1] - 40;
  const marginTop = mar[2];
  const marginBottom = mar[3] + 30;

  if (mouseX < 0 || mouseX > clientWidth || mouseY < 0 || mouseY > clientHeight) {
    snapX = null;
    snapY = null;
    loop();
    return;
  }

  const dataXMin = 0;
  const dataXMax = Depth;
  const plotWidth = clientWidth - marginLeft - marginRight;
  const mouseXVal = dataXMin + ((mouseX - marginLeft) / plotWidth) * (dataXMax - dataXMin);

  snapX = Math.min(Math.max(mouseXVal, dataXMin), dataXMax);
  snapY = attenuationAt(snapX);

  loop();
}

function draw() {
  clear();

  updateEquations();
  AttenuationFunction.update(equation, Depth);

  // Set plot limits dynamically
  attPlot.GPLOT.setXLim(0, Depth);
  attPlot.GPLOT.setYLim(0, Intensity);

  // Enable numeric tick labels
  attPlot.GPLOT.getXAxis().setDrawTickLabels(true);
  attPlot.GPLOT.getYAxis().setDrawTickLabels(true);

  // Draw base plot (axes, grid, ticks, labels)
  attPlot.plotDraw();

  const mar = attPlot.GPLOT.mar;
  const marginLeft = mar[0] + 10;
  const marginRight = mar[1] - 40;
  const marginTop = mar[2];
  const marginBottom = mar[3] + 30;

  const plotWidth = attPlot.GPLOT.outerDim[0] - marginLeft - marginRight;
  const plotHeight = attPlot.GPLOT.outerDim[1] - marginTop - marginBottom;

  // Draw attenuation curve in blue
  stroke(0, 100, 255);
  strokeWeight(3);
  noFill();
  beginShape();
  for (let px = 0; px <= plotWidth; px++) {
    let xVal = (px / plotWidth) * Depth;
    let yVal = Intensity * Math.exp(-Absorb * Conc * xVal / 1e7);
    let py = marginTop + plotHeight - (yVal / Intensity) * plotHeight;
    vertex(marginLeft + px, py);
  }
  endShape();

  // Fixed attenuation depths
  const A10 = -1e7 / (Absorb * Conc) * Math.log(0.9);
  const A20 = -1e7 / (Absorb * Conc) * Math.log(0.8);

  const depths = [
    { depth: A10, color: [255, 100, 100], label: "90%" },
    { depth: A20, color: [255, 180, 50], label: "80%" }
  ];

  // Draw fixed attenuation lines with labels to the right, just above x-axis
  depths.forEach(d => {
    let pxLine = marginLeft + (d.depth / Depth) * plotWidth;
    let pyTop = marginTop;
    let pyBottom = marginTop + plotHeight;

    // Thin, semi-transparent vertical line
    stroke(...d.color, 150);
    strokeWeight(1.5);
    line(pxLine, pyTop, pxLine, pyBottom);

    // Label to the right of the line, just above x-axis
    fill(0);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text(d.label, pxLine + 4, pyBottom - 2);
  });

  // Draw hovered point if mouse over plot
  if (snapX !== null && snapY !== null) {
    const px = marginLeft + (snapX / Depth) * plotWidth;
    const py = marginTop + plotHeight - (snapY / Intensity) * plotHeight;

    stroke(100, 180, 255);
    fill(100, 180, 255, 180);
    ellipse(px, py, 12, 12);

    noStroke();
    fill(0);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(`Depth: ${snapX.toPrecision(3)} µm`, px + 10, py - 20);
    text(`Intensity: ${snapY.toPrecision(3)} mW/cm²`, px + 10, py);
  }

  // Update half-lives
  const es_sec = Math.log(2) / (1000 * QY * Absorb * (Intensity / (119624 / Wavelength) / 1e6));
  const md_sec = Math.log(2) / (1000 * QY * Absorb * (Intensity * Math.exp(-Absorb * Conc * Depth / 1e7) / (119624 / Wavelength) / 1e6));

  ESh = formatTimeWithSigFig(es_sec, 3);
  MDh = formatTimeWithSigFig(md_sec, 3);
  updateHalfLifeText();

  noLoop();
}




// Hamburger menu
function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

// click outside to close
document.addEventListener('click', e => {
  const menu = document.getElementById('menu');
  const btn = document.querySelector('.menu-button');
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// show/hide panels
function togglePanels(hidden) {
  // Get the panels
  const pPanel = productGui.prototype._panel;
  const wPanel = wtGui.prototype._panel;

  if (hidden) {
    pPanel.style.display = 'none';
    wPanel.style.display = 'none';
  } else {
    pPanel.style.display = '';
    wPanel.style.display = '';
  }
}

// show/hide panels
function togglePanels2(hidden) {
  // Get the panels
  const pPanel = gui2.prototype._panel;
  const wPanel = textGui.prototype._panel;

  if (hidden) {
    pPanel.style.display = 'none';
    wPanel.style.display = 'none';
  } else {
    pPanel.style.display = '';
    wPanel.style.display = '';
  }
}
