/*
 * app/modules/ref.js
 *
 * Copyright 2012 (c) Sosolimited http://sosolimited.com
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 */


define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Ref = app.module();

  // Distance from bottom of window at which overlays appear and which open sentences sit below.
	Ref.overlayOffsetY = 200;	
	 
	// Transcript leading
	Ref.transcriptPointSize = 18;
	Ref.transcriptLeading = 24;
	
	// For development, autoscrolling can be disabled completely
  Ref.disableAutoScroll = false;

  // Flag for choosing emoburst trigger
  Ref.useSentistrengthBurst = false;

  // Position of the most recent sentence
  Ref.overlayOffsetY = 100;

  // Threshold for re-attaching autoscrolling
  Ref.autoscrollReattachThreshold = 50;
  
  // Var grid variables for animation of absolutely positioned elements.
  Ref.gridWidth = 136;
  Ref.gutterWidth = 24;
	Ref.gridColumns = [0, 160, 320, 480, 640, 800, 960];

  //For perspective 1000px, these are the x values to use at chosen z depths to get things to align to the grid columns.
  Ref.gridZn300 = { scalar: 1, grid:[-199, 29, 259, 486, 715, 944] };
  Ref.gridZn200 = { scalar: 1, grid:[-133, 74, 280, 485, 690, 896] };
  Ref.gridZn100 = { scalar: 1, grid:[-65, 117, 301, 483, 666, 849] };
  Ref.gridZn50 = { scalar: 1, grid:[-32, 140, 311, 482, 653, 825] };
  Ref.gridZ50 = { scalar: 1, grid:[34, 183, 332, 480, 629, 777] };
  Ref.gridZ100 = { scalar: 1, grid:[68, 204, 342, 479, 616, 754] };
  Ref.gridZ200 = { scalar: 1, grid:[133, 249, 363, 477, 592, 706] };
  Ref.gridZ300 = { scalar: 1, grid:[201, 293, 384, 475, 567, 658] };

  //Colors
  Ref.purple = [101, 45, 106];
  Ref.redOrange = [255, 66, 55];
  Ref.angry = [255,67,55];
	Ref.casual = [244, 146,17];
	Ref.formal = [44,124,141];
	Ref.cheery = [232,12,122];
	Ref.depressed = [122,52,64];  
  
  
  Ref.colorMap = function(color1, color2, channel, range1, range2, val) {  		
	var val_n = (val - range1)/(range2 - range1);
	var color = val_n*color1[channel] + (1.0-val_n)*color2[channel];
	return color;
  }
  
  // Positioning parameters for overlays
  Ref.overlayEnterY = -325; // Distance above line to have big words slide in

  // Return the module for AMD compliance.
  return Ref;

});
