/*
 * app/modules/markupManager.js
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
  "app",
  "modules/overlay",
  "modules/ref"
],

// Map dependencies from above array.
function(app, Overlay, Ref) {

	// This module listens for special events and marks up the transcript - directly or by creating one of several overlay views.
	// It will also listen to transcript scroll events and manage the parallax positioning of the overlays.
	// In addition, it will listen to window resize events and update the overlay positions.
	var MarkupManager = app.module();

  // 60 most common English words from Wikipedia, with lexemes expanded manually
  // This array is ordered, so you can eliminate only the n most common words if you need to
  var commonWords = ["the", "be", "are", "is", "were", "was",
                     "to", "of", "and", "a", "an", "in", "that",
                     "have", "has", "having", "i", "it", "its", "it's",
                     "for", "not", "on", "with", "he",
                     "as", "you", "do", "does", "doing", "did",
                     "at", "this", "but", "his", "by",
                     "from", "they", "we", "say", "says", "saying", "said",
                     "her", "she", "or", "an",
                     "will", "won't", "my", "one", "all", "would", "there", "their",
                     "what", "so", "up", "out", "if", "about", "who", "whome",
                     "get", "got", "gets", "which", "go", "goes", "going", "went",
                     "me", "when", "make", "makes", "making", "made", "can", "can't",
                     "like", "likes", "time", "times", "no", "just", "him",
                     "know", "knows", "knowing", "knew", "take", "takes"];
                     

  MarkupManager.Model = Backbone.Model.extend({
  
  	defaults: function() {
  		return {
  			"overlays":[],
  			"catOverlays": {"posemo": new Overlay.Views.CatView({ category: 'posemo', title: ['BULLISH','ATTITUDE'] }),
  											"negemo": new Overlay.Views.CatView({ category: 'negemo', title: ['GLOOMY', 'OUTLOOK'] }),
  											"certain": new Overlay.Views.CatView({ category: 'certain', title:['UNWAVERING', 'STANCES'] }),
  											"tentat": new Overlay.Views.CatView({ category: 'tentat', title: ['AMBIGUOUS', 'THOUGHTS'] }),
  											"number": new Overlay.Views.CatView({ category: 'number', title: ['DUBIOUS', 'FIGURES'] }),
  											"quote": new Overlay.Views.CatView({ category: 'quote', title: ['HE&nbspSAID', 'SHE&nbspSAID'] }) }

  		}	
  	},
  	
	  initialize: function () {
		  app.on("markup", this.addOverlay, this);			
		  
		  app.on("markup:sentenceLead", this.addTraitOverlay, this);		  	// EG FIXME convert to "markup", type="sentenceLeadMarkup" style.
		  //for testing
		  app.on("keypress:test", this.test, this);
		        
      // add resuable cat overlays to dom
      for (var cat in this.get("catOverlays")) {
	      $('#overlay').append(this.get("catOverlays")[cat].el);
	      this.get("catOverlays")[cat].render();
      }
      app.on("debate:reset", this.clearMarkup, this);
	  },
	  
	  cleanup: function() {
		  app.off(null, null, this);
	  },
	  
	  clearMarkup: function() {
		  $('#overlay').empty();
		  this.set({overlays:[]});
		  
		  // Add resuable cat overlays back into DOM.
      for (var cat in this.get("catOverlays")) {
	      $('#overlay').append(this.get("catOverlays")[cat].el);
	      this.get("catOverlays")[cat].render();
      }
	  },
	  
	  rerender: function() {
	  	
	  	// remove old dom elts, hack, there must be a better way...
	  	$('#overlay').find('.categoryOverlay').parent().parent().parent().remove();
	  	
	  	// make new ones
		  for (var cat in this.get("catOverlays")) {
	      $('#overlay').append(this.get("catOverlays")[cat].el);
	      this.get("catOverlays")[cat].render();
      }
	  },
	  
	  // All overlay events get funnelled through this function.
	  addOverlay: function(args) {
	  	//console.log("markupManager.addOverlay(" + args['type'] + ")");

	  	if(!this.isAnyOverlayExpanded()){
			  if(args['type']=="wordCountMarkup"){
				  this.addWordCountOverlay(args);			  
			  }
			  else if(args['type']=="numberMarkup"){
				  this.addNumberOverlay(args);			  
			  }
			  else if(args['type']=="quoteMarkup"){
				  this.addQuoteOverlay(args);			  
			  }
			  else if(args['type']=="sentimentMarkup"){
				  this.addSentimentOverlay(args);
			  }
		  }
		  		  
		  //always showing the traitlead
		  if(args['type']=="traitLead"){
		   //console.log("received traitLead");
			 this.addTraitOverlay(args);
		  }
	  },
	  
	  isAnyOverlayExpanded: function() {
		  for(var i=0; i<this.get("overlays").length; i++){
				if(this.get("overlays")[i].state == 1)
					return true;  	 			  
		  }
		  return false;		  
	  },
	  
	  showOverlays: function(show) {
			if(show) $('#overlay').css('visibility', 'visible');
			else $('#overlay').css('visibility', 'hidden');
	  },
	  
	  // Functions for adding specific overlays.
	  // -----------------------------------------------------------------------------------
	  addSentimentOverlay: function(args) {
	  	args.anchor.top = this.scaleY(args.anchor.top); // scale for mode
	  
		  var sentimentOverlay = new Overlay.Views.SentimentView(args);
		  $('#overlay').append(sentimentOverlay.el);
      sentimentOverlay.render();
      
      this.get("overlays").push(sentimentOverlay);
	  },
	  
	  addTraitOverlay: function(args) {
		  
	  	var moreVal;
	  	if (args["leader"] == args["curSpeaker"]) moreVal = "MORE ";
	  	else moreVal = "LESS ";	  	
	  	
	  	var speakerString;
	  	(args["curSpeaker"] == 1) ? speakerString = "obama" : speakerString = "romney" ;
	  	
	  	var traitString = "";
	  	//jro changed traits
	  	if (args["trait"] == 'anger') traitString = "ENRAGED";
	  	else if (args["trait"] == 'complexity') traitString = "COMPLEX";
	  	else if (args["trait"] == 'formality') traitString = "DETACHED";
	  	else if (args["trait"] == 'depression') traitString = "SUICIDAL";
	  	else if (args["trait"] == 'honesty') traitString = "HONEST";
	  	
	  	console.log("addTraitOverlay() " + traitString + " leader:" + args["leader"] + " speaker:" + args["curSpeaker"] + " val:" + moreVal);
	  	
	  	var traitsOverlay = new Overlay.Views.TraitView({ trait: traitString, speaker: speakerString, posY: this.scaleY(parseInt(this.attributes.transcript.getCurSentencePosY())), moreVal: moreVal });
	  	$('#overlay').append(traitsOverlay.el);
			traitsOverlay.render();
	  	
	 
	  },
	  
	  addQuoteOverlay: function(args) {
	  	args.anchor.top = this.scaleY(args.anchor.top); // scale for mode
      var quoteOverlay = new Overlay.Views.QuotesView(args);
			//console.log("Anchor: " + args['anchor'].top);
      $('#overlay').append(quoteOverlay.el);
			quoteOverlay.render();		  
			
			this.get("overlays").push(quoteOverlay);			
	  },
	  
	  addWordCountOverlay: function(args){
	  	//console.log("markupManager.addWordCountOverlay, collapseY = "+this.attributes.transcript.getRecentWordPosY(args['word']));	 
	  	
	  	var wordPos = this.attributes.transcript.getRecentWordPos(args['word']);
	  	 	
		  var wordCountOverlay = new Overlay.Views.WordCountView({ speaker: args['speaker'], count: args['count'], word: args['word'], posY: this.scaleY(parseInt(this.attributes.transcript.getCurSentencePosY())), wordPos: [this.scaleY(wordPos[0]), this.scaleY(wordPos[1])], forceCollapse: false });
		  $('#overlay').append(wordCountOverlay.el);
		  wordCountOverlay.render();	
		  
		  this.get("overlays").push(wordCountOverlay);			
	  },
	  
	  addNumberOverlay: function(args){
	  	try {
        args.anchor.top = this.scaleY(args.anchor.top);
	    	//console.log("addNumberOverlay: "+args['speaker']+", "+args['phrase']);
        var numbersOverlay = new Overlay.Views.NumbersView({ speaker: args['speaker'], phrase: args['phrase'], posY: args['anchor'].top, wordPos: args.anchor, forceCollapse: false });
		    $('#overlay').append(numbersOverlay.el);
        numbersOverlay.render();
        //console.log("Number alert: " + args['phrase']);
        this.get("overlays").push(numbersOverlay);			
      }
      catch (e) {
        console.log(e);
      }
	  },
	  
	  // reusable overlays
	  openCatOverlay: function(cat, delay) {
	  	var lay = this.get("catOverlays")[cat];

	  	if (lay) {		  	
	  		lay.expand();
	  		// EG Timeouts not being cancelled, so for now forget the timeout.
		  	//window.setTimeout(function(){lay.collapse();}, delay);
		  }
		  // Hide overlays.
		 	$('.overlayBox').css("visibility", "hidden"); 
		 },
	  
	  closeCatOverlays: function() {
	  	$('.catMarkup').removeClass('reverse');
	    $('.catMarkup').removeClass('grayed');
	  	for (i in this.get("catOverlays")) {
		  	this.get("catOverlays")[i].collapse();
	  	}
	  	// Show overlays.
		 	$('.overlayBox').css("visibility", "");
	  },
	  
	  scaleY: function(val) {
	  	return val;
	  	// EG No more transcript scaling while in comparison mode.
		  //if (app.mode === "transcript") return val;
		  //else if (app.mode === "comparison") return val*2.5;
	  },
	  
 	  // -----------------------------------------------------------------------------------
	  	  
	  handleScroll: function(val) {
 			 //console.log("markupManager.handleScroll("+val+")");
			 $('#transcript > .wrapper').css("perspective-origin", "50% "+(val+500)+"px");
	  },
	  
	  enter: function() {
	    $('#overlay').css("visibility", "visible");
    },
    
    exit: function() {
	    $('#overlay').css("visibility", "hidden");
	    $('.overlayBox').css("visibility", "");	    	    
    },
    
    // Reset puts everything where it's supposed to be before entering.
    reset: function() {
	    $('#overlay').css("visibility", "hidden");
	    $('.overlayBox').css("visibility", "");	    
    },
    
    // For testing things with keypresses.
	  test: function(args) {
		  if(args['type']=="overlay"){
			  if(args['kind']=="traitObama"){
				 		console.log("test - trait overlay");			  
				 		this.addTraitOverlay({speaker: 1, trait:"posemo", posY: this.scaleY(parseInt(this.attributes.transcript.getCurSentencePosY())) });
			  }
			  else if(args['kind']=="traitRomney"){
				 		console.log("test - trait overlay");			  
				 		this.addTraitOverlay({speaker: 2, trait:"depression", posY: this.scaleY(parseInt(this.attributes.transcript.getCurSentencePosY()))});
			  }
			  else if(args['kind']=="wordCount"){
				 		console.log("test - wordCount overlay");			  
				 		//this.addWordCountOverlay();
			  }
		  }
		  else if(args['type']=="testParallax"){
				//Insert some test objects
				console.log("testParallax");
				
				$('#overlay').append("<div style='position:absolute; top:0px; width: 20px; height:12000px; background-color:yellow;'></div>");
				// Testing skrollr.
				for(var y=0; y<30; y++){
					//var newEl = $("<div id='test"+y+"' class='skrollr skrollable skTest' data-"+(y*300)+"='top:100%;color:rgb(255,255,255);' data-"+(y*300+1000)+"='top:0%;color:rgb(0,0,0);'>"+y+"</div>");
					var newEl = $("<div id='test"+y+"' class='skrollr skrollable skTest' style='top:"+(y*300)+"px;' data-top-bottom='margin-top:0px; color:rgb(255,255,255);' data-bottom-top='margin-top:"+(Math.random()*600)+"px; color:rgb(0,0,0);'>"+y+"</div>");
					app.skrollr.refresh(newEl.get(0));

				  $('body').append(newEl);
				  //$('body').append("<div id='test"+y+"' class='skTest' style='top:"+(y*400)+"px;' data-top-bottom='left:0px;color:rgb(255,255,255);' data-bottom-top='left:1000px;color:rgb(0,0,0);'>"+y+"</div>");
				 }
				
				/*
				var sk = skrollr.init({    	
		    beforerender: function(data) {
					//console.log('beforerender');
				},
				render: function() {
					//console.log('render');
				},
				easing: {
					//WTF: Math.random,
					//inverted: function(p) {
					//	return 1-p;
					//}
				}
			});
			*/ 
			   
					
				
				/*
				for(var y=0; y<10; y++){
				  for(var i=0; i<6; i++){	
				  
				  $('#overlay').append("<span id='testZ" + (i+1) + "' class='testZ' style='left:" + Ref.gridZn200['grid'][i] + "px; top:" + (y*600 + 600) + "px; -webkit-transform: translateZ(-200px); background-color:blue;'>" + i + "</span>");
				  	
				  	$('#overlay').append("<span id='testZ" + (i+1) + "' class='testZ' style='left:" + Ref.gridZ100['grid'][i] + "px; top:"  + (y*600 + 600) + "px; -webkit-transform: translateZ(100px); background-color:yellow;'>" + i + "</span>");
				  	
				  	$('#overlay').append("<span id='testZ" + (i+1) + "' class='testZ' style='left:" + Ref.gridZ200['grid'][i] + "px; top:"  + (y*600 + 600) + "px; -webkit-transform: translateZ(200px); background-color:red;'>" + i + "</span>");
				  */
				}	
			}
		  
	  
	  
  });

 
  // Return the module for AMD compliance.
  return MarkupManager;

});
