/* jshint esversion: 6 */

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *           GLOBAL VARIABLES
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
const canvasWidthMargin = 250;  // reserved width for side panels (used in clientWidth calc)
const canvasHeight = 500;

let clientWidth = Math.max(400, window.innerWidth - canvasWidthMargin);
let clientHeight = canvasHeight;

// === Layout Position Variables ===
const mainGuiTop = 0;
const mainGuiLeft = 0;
const mainGuiWidth = clientWidth;  // dynamic width of main GUI panel

const secondaryGuiTopOffset = 400;  // vertical offset for secondary GUI (gui2)
const secondaryGuiLeft = 0;
const secondaryGuiWidth = clientWidth; // same width as main GUI by default

const resultsPanelWidth = 320;          // approx width of Results panel
const resultsPanelLeft = 10;            // margin from left edge
const resultsPanelTopOffset = canvasHeight + 10; // just below canvas

// PRODUCT PANEL layout variables
const productPanelLeftMargin = 10;      
const productPanelTopOffset = resultsPanelTopOffset + 200;  // below results panel with spacing
const productPanelWidth = 200;          
const productPanelHeight = 100;         

// Margins and spacing
const panelHorizontalSpacing = 10;      
const panelVerticalSpacing = 10;        

// GUI setup
let gui;
let gui2;
let textGui;
let productGui;

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
  equation = `${Intensity} * e^(-1 * ${Absorb} * ${Conc} / 10^7 * x)`;
}

// Slider class with plus/minus buttons
class MySlider {
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

    const decimalPlaces = Math.max(0, -Math.floor(Math.log10(step)));
    this.valBox.value = init.toFixed(decimalPlaces);

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

    this.minusBtn = document.createElement("button");
    this.minusBtn.type = "button";
    this.minusBtn.className = "btn btn-secondary";
    this.minusBtn.textContent = "-";

    this.plusBtn = document.createElement("button");
    this.plusBtn.type = "button";
    this.plusBtn.className = "btn btn-secondary";
    this.plusBtn.textContent = "+";

    this.div.appendChild(this.minusBtn);
    this.div.appendChild(this.plusBtn);

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
      const decimalPlaces = Math.max(0, -Math.floor(Math.log10(this.step)));
      const validDecimalRegex = /^[-+]?\d*\.?\d+$/;

      if (val === '' || isNaN(num) || !validDecimalRegex.test(val)) {
        alert('Please enter a valid decimal number.');
        this.valBox.value = this.val.toFixed(decimalPlaces);
        this.valBox.focus();
      } else {
        this.val = num;
        this.onUpdate(true);
      }
    });

    this.minusBtn.addEventListener("click", () => {
      this.val = Math.max(this.min, this.val - this.step);
      this.onUpdate(true);
    });

    this.plusBtn.addEventListener("click", () => {
      this.val = Math.min(this.max, this.val + this.step);
      this.onUpdate(true);
    });
  }

  onUpdate = (round = true) => {
    let sliderVal = this.val;
    if (sliderVal < this.min) sliderVal = this.min;
    if (sliderVal > this.max) sliderVal = this.max;
    this.sliderDiv.value = `${sliderVal}`;

    if (round) {
      this.valBox.value = this.val.toFixed(Math.max(0, -Math.floor(Math.log10(this.step))));
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

    const decimalPlaces = Math.max(0, -Math.floor(Math.log10(step)));
    this.valBox.value = init.toFixed(decimalPlaces);

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
      const decimalPlaces = Math.max(0, -Math.floor(Math.log10(this.step)));
      const validDecimalRegex = /^[-+]?\d*\.?\d+$/;

      if (val === '' || isNaN(num) || !validDecimalRegex.test(val)) {
        alert('Please enter a valid decimal number.');
        this.valBox.value = this.val.toFixed(decimalPlaces);
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
      this.valBox.value = this.val.toFixed(Math.max(0, -Math.floor(Math.log10(this.step))));
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
  Default values are an approximation for TPO<br>
</p>
<p>
  At what depth are you optically thin?<br>
  <b>10% Attenuation:</b> ${A10} µm<br>
  <b>20% Attenuation:</b> ${A20} µm
</p>
<p>
  <b>Initiator Half-life </b>(assuming no diffusion, bleaching, or darkening):<br>
  @ Exposed Surface: ${ESh} h, ${ESm} min, ${ESs} s<br>
  @ Maximum Depth: ${MDh} h, ${MDm} min, ${MDs} s
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
  clientWidth = Math.max(400, window.innerWidth - canvasWidthMargin);
  clientHeight = canvasHeight;

  resizeCanvas(clientWidth, clientHeight);
  attPlot.GPLOT.setOuterDim(clientWidth, clientHeight);
  attPlot.GPLOT.setPos(0, 0);

  gui.prototype.setPosition(clientWidth, attPlot.GPLOT.mar[2]);
  gui2.prototype.setPosition(clientWidth, secondaryGuiTopOffset + attPlot.GPLOT.mar[2]);

  setPanelPosition(textGui, resultsPanelLeft, resultsPanelTopOffset);
  setPanelPosition(productGui, productPanelLeftMargin, productPanelTopOffset);
}

function setup() {
  createCanvas(clientWidth, clientHeight);

  attPlot = new PlotCanvas(this);
  attPlot.plotSetup();
  attPlot.GPLOT.getXAxis().getAxisLabel().setText("Depth (\u03BCm)");
  attPlot.GPLOT.getYAxis().getAxisLabel().setText("Intensity (mW/cm\u00B2)");
  attPlot.GPLOT.getTitle().setText("Attenuation Due to One Absorber");

  // Main GUI
  gui = createGui('Plot Controls', clientWidth, attPlot.GPLOT.mar[2]);
  const parent = gui.prototype._panel;
  const concSlider = new MySlider('Conc', 0, 1000, Conc, 0.1, 'Absorber Concentration', 'mM');
  const absSlider = new MySlider('Absorb', 0, 5000, Absorb, 0.1, 'Napierian Absorptivity', 'L/mol-cm');
  const intSlider = new MySlider('Intensity', 0, 100, Intensity, 0.01, 'Incident Intensity', 'mW/cm\u00B2');
  const dptSlider = new MySlider('Depth', 15, 2000, Depth, 1, 'Depth', '\u03BCm');
  const callbacks = [
    (val) => Conc = val,
    (val) => Absorb = val,
    (val) => Intensity = val,
    (val) => Depth = val
  ];
  [concSlider, absSlider, intSlider, dptSlider].forEach((slider, index) => {
    slider.attachParent(parent);
    slider.setCallback(callbacks[index]);
  });

  // Secondary GUI
  gui2 = createGui('Additional Variables for Half-life', clientWidth, secondaryGuiTopOffset + attPlot.GPLOT.mar[2]);
  const laSlider = new MySlider('Wavelength', 200, 600, Wavelength, 0.1, 'Wavelength', 'nm');
  const qySlider = new MySlider('QY', 0, 1, QY, 0.01, 'Quantum Yield', '');
  const gui2parent = gui2.prototype._panel;
  laSlider.attachParent(gui2parent);
  laSlider.setCallback((val) => Wavelength = val);
  qySlider.attachParent(gui2parent);
  qySlider.setCallback((val) => QY = val);

  // Text GUI for half-life results (Results panel)
  textGui = createGui('Results', resultsPanelLeft, resultsPanelTopOffset);
  textGui.prototype._panel.className = "qs_main text-gui";
  initHalfLifeText(textGui.prototype._panel);

  // === ORIGINAL Product GUI ===
  productGui = createGui('Napierian Absorptivity', productPanelLeftMargin, productPanelTopOffset);
  const productParent = productGui.prototype._panel;

  // Variables for original product sliders
  const productAbsSlider = new ProductSlider('prodAbsorb', 0, 3, productAbsorbance, 0.001, 'Absorbance', '');
  const productConcSlider = new ProductSlider('prodConc', 0, 500, productConcentration, 0.01, 'Concentration Absorber', 'mM');
  const productPathLengthSlider = new ProductSlider('prodPathLength', 0, 5, productThickness, 0.001, 'Path Length', 'cm');

  [productAbsSlider, productConcSlider, productPathLengthSlider].forEach(slider => {
    slider.attachParent(productParent);
  });

  // Result display div for original product GUI
  const productResultDiv = document.createElement('div');
  productResultDiv.style.marginTop = '10px';
  productResultDiv.style.fontWeight = 'bold';
  productResultDiv.style.width = '100%';
  productResultDiv.style.textAlign = 'center';
  productResultDiv.style.flexBasis = '100%';
  productParent.appendChild(productResultDiv);

  function updateProductValue() {
    if (productConcentration === 0) {
      productResultDiv.textContent = 'Product: Concentration cannot be zero';
      return;
    }
    const value = Math.log(10) * productAbsorbance / productThickness / productConcentration * 1e3;

    productResultDiv.innerHTML = '';

    const labelDiv = document.createElement('div');
    labelDiv.textContent = 'Napierian Absorptivity:';
    labelDiv.style.fontWeight = 'bold';

    const valueDiv = document.createElement('div');
    valueDiv.textContent = `${value.toFixed(1)} L/mol-cm`;

    productResultDiv.appendChild(labelDiv);
    productResultDiv.appendChild(valueDiv);

    loop();
  }

  productAbsSlider.setCallback((val) => {
    productAbsorbance = val;
    updateProductValue();
  });
  productConcSlider.setCallback((val) => {
    productConcentration = val;
    updateProductValue();
  });
  productPathLengthSlider.setCallback((val) => {
    productThickness = val;
    updateProductValue();
  });

  updateProductValue();

  // === NEW GUI (duplicated, to the right) ===
  const newGuiLeft = productPanelLeftMargin + productPanelWidth + panelHorizontalSpacing;
  const newGuiTop = productPanelTopOffset;

  const newGui = createGui('wt% to mM conversion', newGuiLeft, newGuiTop);
  const newGuiParent = newGui.prototype._panel;

  // Variables for new sliders and initial values
  let concNew = 0.1;  // wt%
  let dNew = 0.786;   // g/mL
  let MWNew = 348.37; // g/mol

  // Create sliders for new variables
  const concSliderNew = new ProductSlider('conc_wt', 0, 10, concNew, 0.001, 'Concentration Absorber', 'wt%');
  const dSliderNew = new ProductSlider('density', 0, 2, dNew, 0.001, 'Density', 'g/mL');
  const mwSliderNew = new ProductSlider('mol_weight', 0, 1000, MWNew, 0.01, 'Absorber Molecular Weight', 'g/mol');

  [concSliderNew, dSliderNew, mwSliderNew].forEach(slider => {
    slider.attachParent(newGuiParent);
  });

  // Output display div for new GUI
  const concOutputDiv = document.createElement('div');
  concOutputDiv.style.marginTop = '10px';
  concOutputDiv.style.fontWeight = 'bold';
  concOutputDiv.style.width = '100%';
  concOutputDiv.style.textAlign = 'center';
  concOutputDiv.style.flexBasis = '100%';
  newGuiParent.appendChild(concOutputDiv);

  function updateConcentration() {
    if (MWNew === 0) {
      concOutputDiv.textContent = 'Molecular Weight cannot be zero';
      return;
    }
    // Calculate concentration in mM
    const concentration_mM = (concNew * dNew / MWNew) * 1e4;  // in mM

    concOutputDiv.innerHTML = '';
    const labelDiv = document.createElement('div');
    labelDiv.textContent = 'Concentration:';
    labelDiv.style.fontWeight = 'bold';

    const valueDiv = document.createElement('div');
    valueDiv.textContent = `${concentration_mM.toFixed(2)} mM`;

    concOutputDiv.appendChild(labelDiv);
    concOutputDiv.appendChild(valueDiv);

    loop();
  }

  concSliderNew.setCallback((val) => {
    concNew = val;
    updateConcentration();
  });

  dSliderNew.setCallback((val) => {
    dNew = val;
    updateConcentration();
  });

  mwSliderNew.setCallback((val) => {
    MWNew = val;
    updateConcentration();
  });

  updateConcentration();

  updateEquations();

  AttenuationFunction = new Plot(equation, "x", 0, Depth);
  AttenuationFunction.lineThickness = 5;
  attPlot.addFuncs(AttenuationFunction);
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

  attPlot.GPLOT.setXLim(0, Depth);
  attPlot.GPLOT.setYLim(0, Intensity);
  attPlot.plotDraw();

  if (snapX !== null && snapY !== null) {
    const mar = attPlot.GPLOT.mar;
    const marginLeft = mar[0] + 10;
    const marginRight = mar[1] - 40;
    const marginTop = mar[2];
    const marginBottom = mar[3] + 30;

    const dataXMin = 0;
    const dataXMax = Depth;
    const dataYMin = 0;
    const dataYMax = Intensity;

    const plotWidth = clientWidth - marginLeft - marginRight;
    const plotHeight = clientHeight - marginTop - marginBottom;

    const px = marginLeft + ((snapX - dataXMin) / (dataXMax - dataXMin)) * plotWidth;
    const py = marginTop + plotHeight - ((snapY - dataYMin) / (dataYMax - dataYMin)) * plotHeight;

    stroke(100, 180, 255);
    fill(100, 180, 255, 180);
    ellipse(px, py, 12, 12);

    noStroke();
    fill(0);
    textSize(14);
    text(`Depth: ${snapX.toFixed(2)} \u03BCm`, px + 10, py - 20);
    text(`Intensity: ${snapY.toFixed(2)} mW/cm\u00B2`, px + 10, py);
  }

  // Update attenuation depths at 10% and 20%
  A10 = Math.round(-1 * 10 ** 7 / Absorb / Conc * Math.log(0.9));
  A20 = Math.round(-1 * 10 ** 7 / Absorb / Conc * Math.log(0.8));

  // Calculate half-life at surface and max depth
  const es = Math.round(
    Math.log(2) / (1000 * QY * Absorb * (Intensity / (119624 / Wavelength) / 10 ** 6))
  );
  ESh = Math.floor(es / 3600);
  ESm = Math.round((es % 3600) / 60);
  ESs = es % 60;

  const md = Math.round(
    Math.log(2) / (1000 * QY * Absorb *
      (Intensity * Math.exp(-1 * Absorb * Conc * Depth / 10 ** 7) /
      (119624 / Wavelength) / 10 ** 6))
  );
  MDh = Math.floor(md / 3600);
  MDm = Math.round((md % 3600) / 60);
  MDs = md % 60;

  updateHalfLifeText();

  noLoop();
}
