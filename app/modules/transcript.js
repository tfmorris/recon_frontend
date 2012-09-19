define([
  // Application.
  "core/app",
  "modules/overlay",
  "modules/ref"
],

// Map dependencies from above array.
function(app, Overlay, Ref) {

  // Create a new module.
  var Transcript = app.module();
  var curSpeaker = -1;
  var speakers = ["Moderator", "Obama", "Romney"];
  var openSentence = null;
  var openParagraph = null;
  var scrollLive = false;		

  // Default model.
  Transcript.Model = Backbone.Model.extend({
  		
  });

  Transcript.View = Backbone.View.extend({
    
    initialize : function() {
      app.on("message:word", this.addWord, this);
      app.on("message:sentenceEnd", this.endSentence, this);
  	},

    events : {
      "scroll" : "handleScroll"
    },
  	
    cleanup: function() {
	    app.off(null, null, this);
    },

    addWord: function(args) {
    
	    var word = args['msg'];
	    
	    
    	// check if saying word
    	if ($.inArray('say', word['cat']) != -1) {
	    	app.trigger("markup:quote", {type:'quote', speaker:word['speaker']});
    	}
	    
	    // add to transcript
    	var s = "";

      var col=1;
    		
    	if (word["speaker"] != curSpeaker) {
    		curSpeaker = word["speaker"];
    		
    		// emit message to add chapter marker
    		app.trigger("playback:addChapter", {msg:word});

   			if(curSpeaker==0) col = 2;	//obama
    		else if(curSpeaker==2) col = 3;	//romney
    		
    		if (openSentence) this.endSentence();
    		if (openParagraph) this.endParagraph();	    		
    		
        //	this.$el.children().first().append("<div id=curParagraph class='push-" + col + " span-3 " +

    		this.$el.append("<div id=curParagraph class='push-" + col + " span-3 " +
          speakers[curSpeaker] + " transcriptParagraph'><h1 class='franklinMedIt gray80'>" +
          speakers[curSpeaker] + "</h1><p class='metaBook gray80'></p></div><div class=clear></div>");
          
    		openParagraph = true;
    	}
    	
    	
    	if (word["sentenceStartFlag"]) this.endSentence();
    	
    	if (!openSentence) {
    		$('#curParagraph p').append("<span id=curSentence class='transcriptSentence'></span>"); // add sentence span wrapper
    		//app.trigger("transcript:sentenceOpen");	//testing for markup manager
    		openSentence = true;
    	}
    	
    	if (!word["punctuationFlag"]) s += " "; // add leading space
    	


    	//console.log("type = "+word["type"] + " w = "+word["word"]+" - wordInstances = "+word["wordInstances"]);
    	// If word is frequent, treat it.
    	//if(word["wordInstances"] >= wordCountThreshold){
    	//	$('#curSentence').append("<span id="+word["id"]+" class='frequentWord transcriptWord'>"+s+word["word"]+"</span>"); // add word
    	//}else{
    		$('#curSentence').append("<span id="+word["id"]+" class='transcriptWord'>"+s+word["word"]+"</span>"); // add word
    	//}
    	
      // Scroll the view if needed
      if(scrollLive) {
        this.$el.stop().animate({ scrollTop: parseInt(this.$el.prop("scrollHeight"))}, 10);
        app.trigger("transcript:scrollTo", word["timeDiff"]); 
      }
    
    },
    
    endSentence: function(args) {
      // Add word count superscript to frequent words.
      // ---------------------------------------------
      // Frequent words are marked by a class named "frequentWord"
      // and have an attribute "data-wordcount" added by markupManager
      var mainEl = this.$el;
    	$('#curSentence').find('.frequentWord').each(function() {
    		$(this).css("background-color", "white");
        var count = $(this).attr("data-wordcount");
        if(count != undefined) {
          // Add a div at this point and animate it in
          var pos = $(this).position();
          var wordWidth = $(this).width();
          var lineHeight = $(this).height();
          var container = $("<div class='wordCountFrame' style='left: " + (pos.left + wordWidth) + "px; top: " + (pos.top - lineHeight/2) + "px;'></div>");
          var countDiv = $("<div class='wordCount'>x" + count + "</div>");
          container.append(countDiv);
          $(this).parent().append(container);
          countDiv.animate({top: '0px'}, 300);
        }
    	});
    
      // Close this sentence, start a new one.
    	$('#curSentence').removeAttr('id');
    	openSentence = false;
    	if (args)
	    	app.trigger("markup:sentenceSentiment", {type:'sentenceSentiment', speaker:args['msg']['speaker'], sentiment:args['msg']['sentiment']});
    },
    
    endParagraph: function() {
    	$('#curParagraph').removeAttr('id');
    	openParagarph = false;
    },
    
    // Used by markupManager to retrieve recently added words. Returns associated span.
    // Gotta do this because of asynchronous messages.
    addClassToRecentWord: function(word, className) {
	    // Backwards traversal of current sentence words.
	    // PEND This won't work if the current sentence is closed before this is called.
	  	//$('#curSentence span:last-child').prevAll().each(function() {

	  	// Searching forwards just for testing.
	  	$('#curSentence').children().each(function() {
	  		//console.log("getRecentWordEl-" + word + "-?-" + $(this).html());
		  	if($.trim($(this).text()).toLowerCase() == $.trim(word).toLowerCase()){ 
		  		//console.log("getRecentWordEl: found");
		  		$(this).addClass(className);	
		  		//return $(this);
		  	}
	  	});
	  	//return;	 
    },

    getCurSentencePosY: function() {
	    //return $('#curSentence').offset().top;	//Breaks when scrollTop of div is > 0.
	    return (this.$el.scrollTop() + $('#curParagraph').position().top + $('#curSentence').position().top);
    },
    
    handleScroll : function() {
    
    	//console.log("handleScroll " + parseInt(this.$el.prop("scrollHeight")));
    	
      // Figure out which word is at the bottom of the screen and fire an event
      var buffer = 50; // How far from the bottom the "bottom" is
      var scrolled = this.$el.scrollTop();
      var bottomLine = this.$el.scrollTop() + this.$el.height() - buffer;
      

      //$("#scrollLine").offset({"left": 0, "top": bottomLine - scrolled});

      // First loop through paragraphs
      var scrolledParagraph = null;
      var closestParagraph = null;
      var closestDistance = 1000000;
      $(".transcriptParagraph").each(function(index, el) {
        var paraTop = $(el).offset().top + scrolled;
        var paraBottom = paraTop + $(el).height();

        if(bottomLine <= paraBottom && bottomLine > paraTop) {
          scrolledParagraph = $(el);
          return false; // break the each loop
        }
        else if(Math.abs(paraBottom - bottomLine) < closestDistance) {
          closestDistance = Math.abs(paraBottom - bottomLine);
          closestParagraph = $(el);
        }
      });

      if(!scrolledParagraph) 
        scrolledParagraph = closestParagraph;


      // Loop through words in this paragraph
      var scrolledWord = null;
      var closestWord = null;
      closestDistance = 1000000;
      scrolledParagraph.find("span").not(".transcriptSentence").each(function(index, el) {
        var wordTop = $(el).offset().top + scrolled;
        var wordBottom = wordTop + $(el).height();
        //console.log("Bottom: " + wordBottom + " < Scrolled: " + bottomLine + " < Top: " + wordTop + "??");
        if(bottomLine < wordBottom && bottomLine > wordTop) {
          scrolledWord = $(el);
          return false; // break the each loop
        }
        else if(Math.abs(wordBottom - bottomLine) < closestDistance) {
          closestDistance = Math.abs(wordBottom - bottomLine);
          closestWord = $(el);
        }
      });
      
      if(!scrolledWord)
        scrolledWord = closestWord;

      var messageID = scrolledWord.attr('id');
      // Find the message
      // TODO: Fix this so it doens't have to search the whole collection every time
      var timeDiff = null;
      for(var i=0; i<this.options.messages.length; i++) {
        if(this.options.messages.at(i).get('id') == messageID) {
          timeDiff = this.options.messages.at(i).get('timeDiff');
          break;
        }
      }
      if(timeDiff) {
        app.trigger("transcript:scrollTo", timeDiff);
      }

      /* 
      // To debug, highlight the word that we think the transcript is scrolled to
      $(".currentlyScrolled").css("background-color", "transparent");
      $(".currentlyScrolled").removeClass("currentlyScrolled");
      scrolledWord.css("background-color", "white");
      scrolledWord.addClass("currentlyScrolled");
      */
    },
    
    resetToNode: function(n) {
	    
  		// clear out following text in prep for playback
  		curSpeaker = "";
  		this.endSentence();
  		this.endParagraph();
  		$('#'+n).parent().parent().parent().nextAll().andSelf().remove();
  		
    }
  });

  // Return the module for AMD compliance.
  return Transcript;

});
