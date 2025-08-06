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
  /**
   * Create a new slider in the dom. Note it must be attached to a parent to become visible.
   * @param {string} key Unique ID to assign to the elements
   * @param {number} min minimum value
   * @param {number} max maximum value
   * @param {number} init initial value
   * @param {number} step slider minimum step
   * @param {string} label slider label to go before value
   * @param {string} units unit label to go after value
   */
  constructor (key, min, max, init, step, label, units) {
    // Create an element in the DOM
    const containerDiv = document.createElement("div");
    // Assign a unique id and the css style class
    containerDiv.id = `${key}-container`;
    containerDiv.className = "qs_container";
    
    // Create the label
    const labelDiv = document.createElement("div");
    labelDiv.id = `${key}-label`;
    labelDiv.className = "qs_label";

    // Create input box inside label first
    const valBox = document.createElement("input");
    valBox.id = `${key}-value-box`;
    valBox.type = "text";
    valBox.value = `${init.toFixed(-Math.log10(step))}`;
    valBox.style = "width:40px";
    // Append the text to the label
    labelDiv.innerHTML = `<b>${label}:</b> `;
    labelDiv.append(valBox);
    labelDiv.append(` ${units}`);
    containerDiv.appendChild(labelDiv);

    // Create the slider
    const sliderDiv = document.createElement("input");
    sliderDiv.id = `${key}-slider`;
    sliderDiv.className = "qs_range";
    sliderDiv.type = "range";
    // Range attributes
    sliderDiv.min=`${min}`;
    sliderDiv.max=`${max}`;
    sliderDiv.step=`${step}`;
    sliderDiv.value = `${init}`;
    // Append
    containerDiv.appendChild(sliderDiv);

    // Create the + and - buttons
    const plusBtn = document.createElement("button");
    plusBtn.innerHTML = "+";
    const minusBtn = document.createElement("button");
    minusBtn.innerHTML = "-";
    [minusBtn, plusBtn].forEach((btn) => {
      btn.type = "button";
      btn.className = "btn btn-secondary";
      containerDiv.appendChild(btn);
    });
  
    // Update class variables
    this.label = label;
    this.units = units;
    this.step = step;
    this.val = init;
    this.max = max;
    this.min = min;
    this.div = containerDiv;
    this.sliderDiv = sliderDiv;
    this.valBox = valBox;
    this.minusBtn = minusBtn;
    this.plusBtn = plusBtn;
    this.callback = null;

    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Set the internal callback for a slider. Use this to modify parent values
   * @param {(value: number) => {}} callback Function that will be called with (newValue) each time the value is modified
   */
  setCallback = (callback) => {
    this.callback = callback;
  }

  /**
   * Add appropriate event listeners to the relevant DOM elements
   */
  addEventListeners = () => {
    // Slider
    this.sliderDiv.addEventListener("input", (event) => {
      this.val = Number(event.target.value);
      this.onUpdate();
    });

    // Text box
    this.valBox.addEventListener("input", (e) => {
      const value = Number(e.target.value);
      if (value !== value) {
      }
      else {
        this.val = value;
        this.onUpdate(false);
      }
    });

    // Minus button
    this.plusBtn.addEventListener("click", () => {
      // Increment, but not past max
      this.val = min(this.val + this.step, this.max);
      this.onUpdate(true);
    });

    // Plus button
    this.minusBtn.addEventListener("click", () => {
      // Decrement, but not past min
      this.val = max(this.val - this.step, this.min);
      this.onUpdate(true);
    });
  }

  /**
   * Function to be called internally each time a value is modified
   */
  onUpdate = (round=true) => {
    // Update the label
    this.sliderDiv.value = `${this.val}`;
    this.valBox.value = `${round ? this.val.toFixed(-Math.log10(this.step)) : this.val}`;
    // Call the callback if it is not null
    this.callback?.(this.val);
    // Redraw the canvas
    loop();
  }

  /**
   * Attach a parent element to the slider container.
   * @param {HTMLElement} parent new parent element for the slider.
   */
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
  Need to find your Naperian absorbtivity? <-- **Add link here**
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
