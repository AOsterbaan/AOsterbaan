/* jshint esversion: 6 */

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *           GLOBAL VARIABLES         
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
var clientWidth = Math.max(200, window.innerWidth - 250);
var clientHeight = 500
//GUI setup
var gui;
var gui2;
var textGui;
// Variables for Calcs
var Conc = 50;
var Absorb = 510;
var Intensity = 10;
var Depth = 500;
var Wavelength = 405;
var QY = .55;
// Graphing Function Prep
var attPlot;
var equation;
// Variables for numerical outputs
var A10 = 0;
var A20 = 0;
var ESh = 0;
var ESm = 0;
var ESs = 0;
var MDh = 0;
var MDm = 0;
var MDs = 0;

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Event handler: updating equations
 *    when the slider moves        
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function updateEquations() {
  equation = `${Intensity} * ${Math.exp(1)} ^ (-1 * ${Absorb} * ${Conc} / 10^7 * x)`
}

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Interactions
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

// In Vanilla.js, interactions are handled by attaching 
// event listeners to components in the DOM (browser page's memory).

// Here we will describe a class to attach the event listeners for sliders for us.
// Under the hood, this is the same as what p5.gui.js is doing, only we can tell it 
// exactly how we want our sliders to look.

/**
 * Abstraction class to set and handle slider logic. Basically, this avoids having to create each slider in the index.html file,
 *   and puts logic behind it with event listeners. This is similar to how p5.gui works, but with more flexibility.
 */



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
    // Slider input clamps and updates val
    this.sliderDiv.addEventListener("input", (event) => {
      this.val = Number(event.target.value);
      this.onUpdate();
    });

    // Text input allows partial typing, updates val only on valid numbers
    this.valBox.addEventListener("input", (e) => {
      const str = e.target.value;

      // Allow intermediate inputs like '', '-', '.', '-.'
      if (str === '' || str === '-' || str === '.' || str === '-.') {
        return; // just let user type
      }

      const num = Number(str);

      if (!isNaN(num)) {
        this.val = num;
        this.onUpdate(false); // update slider but do NOT overwrite textbox value
      }
      // else do nothing, user can fix input
    });

    // On blur, validate fully and fix or revert input
    this.valBox.addEventListener("blur", () => {
      const val = this.valBox.value.trim();
      const num = Number(val);
      const decimalPlaces = Math.max(0, -Math.floor(Math.log10(this.step)));
      const validDecimalRegex = /^[-+]?\d*\.?\d+$/;

      if (
        val === '' ||
        isNaN(num) ||
        !validDecimalRegex.test(val)
      ) {
        alert('Please enter a valid decimal number.');
        this.valBox.value = this.val.toFixed(decimalPlaces);
        this.valBox.focus();
      } else {
        this.val = num;
        this.onUpdate(true); // round and update UI
      }
    });

    // Minus button: decrement val, slider clamped on update
    this.minusBtn.addEventListener("click", () => {
      this.val = this.val - this.step;
      this.onUpdate(true);
    });

    // Plus button: increment val, slider clamped on update
    this.plusBtn.addEventListener("click", () => {
      this.val = this.val + this.step;
      this.onUpdate(true);
    });
  }

  onUpdate = (round = true) => {
    // Clamp slider to min/max for display
    let sliderVal = this.val;
    if (sliderVal < this.min) sliderVal = this.min;
    if (sliderVal > this.max) sliderVal = this.max;
    this.sliderDiv.value = `${sliderVal}`;

    // Update valBox only if round === true (on blur/buttons)
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




   




/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Half-life Text Box
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

// Keep track of the label div
const hlLabel = document.createElement("div");

/**
 * Initialize the text for the half-life description
 * @param {HTMLElement} parent parent element to append the textbox to
 */
function initHalfLifeText(parent) {
  // Create a new div
  const hlDiv = document.createElement("div");
  // Assign a unique id and the css style class
  hlDiv.id = `hl-container`;
  hlDiv.className = "qs_container";
  // Append to parent
  parent.appendChild(hlDiv);

  // Create a label to write info to
  hlLabel.id = `${key}-label`;
  hlLabel.className = "qs_label";
  hlDiv.appendChild(hlLabel);
}

/**
 * Update the textbox for the half life information
 */
function updateHalfLifeText() {
  hlLabel.innerHTML = `
<p>
  Default values are an approximation for TPO<br>
  Need to find your Napierian absorbtivity? <-- **Add link here**
</p>
<p>
  At what depth are you optically thin?<br>
  <b>10% Attenuation:</b> ${A10} µm<br>
  <b>20% Attenuation:</b> ${A20} µm
</p>
<p>
  <b>Initiator Half-life </b>(assuming no diffusion, bleaching, or darkening):<br>
  @ Exposed Suface: ${ESh} h, ${ESm} min, ${ESs} s<br>
  @ Maximum Depth: ${MDh} h, ${MDm} min, ${MDs} s
</p>
  `;
}

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * What to do when the browser is resized         
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function windowResized() {
  // retrieve the new client width
  clientWidth = Math.max(200, window.innerWidth - 250);
  clientHeight = 500

  // resize the canvas and plot, reposition the GUI 
  resizeCanvas(clientWidth, clientHeight);
  attPlot.GPLOT.setOuterDim(clientWidth, clientHeight);
  attPlot.GPLOT.setPos(0, 0);
  gui.prototype.setPosition(clientWidth, attPlot.GPLOT.mar[2]);
  gui2.prototype.setPosition(clientWidth, 400 + attPlot.GPLOT.mar[2]);
  textGui.prototype.setPosition(0, clientHeight);
}

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *        Set up the canvas         
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function setup() {
  createCanvas(clientWidth, clientHeight);

  // Declare a plot
  attPlot = new PlotCanvas(this);
  attPlot.plotSetup();
  attPlot.GPLOT.getXAxis().getAxisLabel().setText("Depth (\u03BCm)");
  attPlot.GPLOT.getYAxis().getAxisLabel().setText("Intensity (mW/cm\u00B2)");
  //attPlot.GPLOT.getYAxis().getAxisLabel().textSize(24)
  //-----Investigate how to change font size-----
  attPlot.GPLOT.getTitle().setText("Attenuation Due to One Absorber");

  // Create the GUI using p5.gui.js
  gui = createGui('Plot Controls', clientWidth, attPlot.GPLOT.mar[2]);
  const parent = gui.prototype._panel;
  // Create sliders
  // Const is block scoped, so if you need to refer to the sliders elsewhere, move the decalrations outside of this function, then create them in this function.
  // JS has a garbage collector, but since these objects attach event listeners in the DOM, they won't be deleted when they are dereferenced.
  const concSlider = new MySlider('Conc'     ,  0, 1000,      Conc,  0.1, 'Absorber Concentration', 'mM');
  const absSlider  = new MySlider('Absorb'   ,  0, 5000,    Absorb,  0.1, 'Napierian Absorbtivity', 'L/mol-cm');
  const intSlider  = new MySlider('Intensity',  0,  100, Intensity, 0.01,     'Incident Intensity', 'mW/cm\u00B2');
  const dptSlider  = new MySlider('Depth'    , 15, 2000,     Depth,    1,                  'Depth', '\u03BCm');
  // Attach callbacks and parent element
  callbacks = [
    (val) => Conc = val,
    (val) => Absorb = val,
    (val) => Intensity = val,
    (val) => Depth = val
  ];
  [ concSlider, absSlider, intSlider, dptSlider ].forEach((slider, index) => {
    slider.attachParent(parent);
    slider.setCallback(callbacks[index]);
  });

  // Gui 2
  gui2 = createGui('Additional Variables for Half-life', clientWidth, 400 + attPlot.GPLOT.mar[2]);
  const laSlider = new MySlider('Wavelength', 200, 600, Wavelength, 0.1, 'Wavelength', 'nm');
  const qySlider = new MySlider('QY', 0, 1, QY, 0.01, 'Quantum Yield', '');
  const gui2parent = gui2.prototype._panel;
  laSlider.attachParent(gui2parent);
  laSlider.setCallback((val) => Wavelength = val);
  qySlider.attachParent(gui2parent);
  qySlider.setCallback((val) => QY = val);

  textGui = createGui('Results', 0, clientHeight);
  // Edit the style to increase the with
  textGui.prototype._panel.className = "qs_main text-gui";
  initHalfLifeText(textGui.prototype._panel);

  updateEquations();

  AttenuationFunction = new Plot(equation, "x", 0, Depth);
  AttenuationFunction.lineThickness = 5;

  attPlot.addFuncs(AttenuationFunction);
}

/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *          Main Program Loop       
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function draw() {
  //Plotting
  clear();
  updateEquations();

  AttenuationFunction.update(equation, Depth);
  attPlot.GPLOT.setXLim.apply(attPlot.GPLOT, [0, Depth]);
  attPlot.GPLOT.setYLim.apply(attPlot.GPLOT, [0, Intensity]);

  attPlot.plotDraw();

  // Additional Calcs--------------- Add with text below the Graph
  //10% Attenuation (micron):
  A10 = Math.round(-1 * 10 ** 7 / Absorb / Conc * Math.log(0.9));
  console.log(A10);
  //20% Attenuation (micron):
  A20 = Math.round(-1 * 10 ** 7 / Absorb / Conc * Math.log(0.8));
  //Initiator Half-life
  //@Exposed Surface -- hours, min, sec
  const es = Math.round(Math.log(2) / (1000 * QY * Absorb * (Intensity / (119624 / Wavelength) / 10 ** 6)));
  ESh = Math.floor(es / 3600);
  ESm = Math.round((es % 3600) / 60);
  ESs = es % 60;
  //@Maximum Depth -- hours, min, sec
  const md = Math.round(Math.log(2) / (1000 * QY * Absorb * (Intensity * Math.exp(-1*Absorb * Conc * Depth / 10 ** 7) / (119624 / Wavelength) / 10 ** 6)));
  MDh = Math.floor(md / 3600);
  MDm = Math.round((md % 3600) / 60);
  MDs = md % 60;
  updateHalfLifeText();

  // Set no loop here so the simulation won't continue to run at 60 fps
  noLoop();
}
