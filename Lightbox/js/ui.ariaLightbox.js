/*!
 * jQuery UI AriaLightbox (02.06.10)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends: ui.core.js 1.8
 */
/*
 USAGE:::::::::::::
* Take a look in the html file or the (german) pdf file delivered with this example
* The widget gets all the elements in the document which matches choosen selector
* There are to modes: singleview and galleryview defined with imageArray: []

 * Options	
imageArray:			activates galleryview of set to imageArray: []
altText: 			which attr (within the image) as alt attr
descText: 			which attr (within the image) as description text
prevText: 			text on the button
nextText: 			see above
titleText: 			titleText of the lightbox
pictureText: 		string: picture
ofText: 			string: of
closeText: 			string: close element
pos: 				position of the lightbox, possbible values: auto, offset, or [x,y] (like pos: "100,300")
autoHeight: 		margin to top when pos: auto is used
offsetX: 			number: if pos:"offset" its the distance betwen lightbox and mousclick position
offsetY:  			see above
disableWidth: 		min width of the screen (otherwise widget is disabled)
disableHeight: 		max width of the screen
useDimmer: 			boolean, activate or deactivate dimmer
animationSpeed:		in millseconds or jQuery keywors aka "slow", "fast"
zIndex: 			number: z-index for overlay elements
background: 		color in HTML notation
opacity: 			decimal betwen 1-0
makeHover: 			deactivate hover events for images
em: 				muliplicator for relative width (em) calculation, normally not to be edited
jqAddress			You need to add the add the jQuery Address file, please see demo file!
	enable			enable browser history support
	title
		enable		enable title change
		split		set delimiter string
 

* Callbacks
onShow
onChangePicture
onClose
onPrev
onNext

* public Methods
startGallery		parameter: event
close
next
prev
disable
enable
disable
destroy
 
 */
(function($) {

$.widget("ui.ariaLightbox", {

	version: '1.8',
	options: {	
		// text strings		
		altText: function() {
			// $(this) is the triggered element (in this case the link element)
			return $(this).find("img").attr("alt");
		},
		descText: function() {
			return $(this).find("img").attr("title");
		},
		prevText: "previous picture",
		nextText: "next picture",		
		titleText: "Lightbox",
		pictureText: "Picture",
		ofText: "of",
		closeText: "Close [ESC]",
		// positioning
		pos: "auto",
		autoHeight: 50,
		offsetX: 10,
		offsetY:  10,
		// disable lightbox if screens below:
		disableWidth: 550,
		disableHeight: 550,
		// config screen dimmer
		useDimmer: true,
		animationSpeed: "slow",		
		zIndex: 1000,
		background: "black",
		opacity: 0.8,
		// misc
		makeHover: true,
		em: 0.0568182,
		// don not alter this var
		activeImage: 0,		
		// jQuery Address
		jqAddress: {
			enable: true,
			title: {
				enable: true,
				split: ' | '		
			}
		}
	},
	
	_create: function() {	
		var options = this.options, self = this;
		
		// save all elements if its a gallery
		if (options.imageArray) {	
			options.selector = options.imageArray;
			options.imageArray = self.element.find(options.imageArray);
			// make hover
			if (options.makeHover) options.imageArray.each(function() { self._makeHover($(this)); });
		} else {
			// make hover
			if (options.makeHover) self._makeHover(self.element);
		}		
		
		// add jQuery Address stuff
		if ($.address && options.jqAddress.enable) {
			$.address.externalChange(function(event) {		
				// Select the proper picture		
				if (event.value == "" && options.wrapperElement) self.close();
				else if (options.imageArray) {	
					for (var x = 0; x < options.imageArray.length; x++) {
						if ($(options.imageArray[x]).attr("href") == event.value) {
							options.activeImage = x;
							// no second argument as there is no mouse click event
							self._open($(options.imageArray[x]));
							self._setButtonState();
							return;
						}
					}
				} else {
					// no second argument as there is no mouse click event
					if (self.element.attr("href") == event.value) self._open(self.element);
				}		
			});
		}
		
		// set trigger event			
		self.element.click(function (event) {	
			// single image?
			if (!options.imageArray) {
				return self._open($(this), event);
			} else {			
				// get the a tag with our selector within the choosen context
				target = $(event.target).closest(options.selector, self.element);
				if (target.length) { 	
					// set active element if gallery mode is activated
					options.activeImage = options.imageArray.index(target);
					return self._open(target, event);
				}
			}					
		});	

		// only set resize event when lightbox is activated
		if (options.useDimmer)
		$(window).resize(function(){ 
			if (!options.disabled) self._dimmerResize();
		});				
	},
	
	// call gallery from link
	startGallery: function (event, index){
		index = (index) ? index : 0;
		this.options.activeImage = index;
		return this._open($(this.options.imageArray[index]), event);
	},
	
	// check if lightbox is already opened
	_open: function (element, event){
		var options = this.options, self = this;	
		// only activate when widget isnt disabled and screen isn't to small
		if (!options.disabled && $(window).width()-options.disableWidth > 0 && $(window).height()-options.disableHeight > 0) {
			// save clicked element (needed if lightbox is controlled by keyboard only)
			if (event) options.clickedElement = event.currentTarget;
			
			// if wrapper element isnt found, create it
			options.wrapperElement = $("body>div#ui-lightbox-wrapper");
			if(!options.wrapperElement.length) self._show(element, event);
			else self._changePicture(element, event);
			return false; // do not follow link
		}
		return true;
	},
	
	// called if lightbox wrapper element is not injected yet
	_show: function (element, event){
		var options = this.options, self = this;		
		
		// build html 
		var html = "\n";
		html += '<div id="ui-lightbox-wrapper" style="z-index:'+options.zIndex+1+';" class="ui-dialog ui-widget ui-widget-content ui-corner-all" tabindex="-1" role="dialog" aria-labelledby="ui-dialog-title-dialog">'+"\n";
		html += '	<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">'+"\n";
		html += '		<span class="ui-dialog-title" id="ui-dialog-title-dialog">'+ options.titleText +'</span>'+"\n";
		html += '		<a href="#nogo" id="ui-lightbox-close" class="ui-dialog-titlebar-close ui-corner-all" title="'+ options.closeText +'" role="button">'+"\n";
		html += '			<span class="ui-icon ui-icon-closethick">'+ options.closeText +'</span>'+"\n";
		html += '		</a>'+"\n";
		html += '	</div>'+"\n";
		html += '	<div id="ui-lightbox-content">'+"\n";
		html += '		<div id="ui-lightbox-image"><img src="" aria-describedby="ui-lightbox-description" /></div>'+"\n";
		html += '		<p id="ui-lightbox-description"></p>'+"\n";
		// show pager and range description if its an array of images
		if (options.imageArray) { 
		html += '		<p id="ui-lightbox-pager"></p>'+"\n";
		html += '		<div id="ui-dialog-buttonpane" class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">'+"\n";
		html += '			<button id="ui-lightbox-next" type="button" class="ui-state-default ui-corner-all">'+ options.nextText +'</button>'+"\n";
		html += '			<button id="ui-lightbox-prev" type="button" class="ui-state-default ui-corner-all">'+ options.prevText +'</button>'+"\n";
		html += '		</div>'+"\n";
		}
		html += '	</div>	'+"\n";
		html += '</div>'+"\n";	
		
		// create dimmer
		if (options.useDimmer) self._lightboxCreate();
		
		// inject HTML
		$("body").append(html);
		
		// Callback
		self._trigger("onShow", 0);
		// get lightbox element
		options.wrapperElement = $("body>div#ui-lightbox-wrapper");			
		
		// enable keyboard navigation 
		if(options.imageArray) { 
			options.wrapperElement.keydown( function(event){ 
				if(event.keyCode == $.ui.keyCode.RIGHT) 	self.next(); 
				if(event.keyCode == $.ui.keyCode.DOWN) 		self.next(); 
				if(event.keyCode == $.ui.keyCode.UP) 		self.prev(); 
				if(event.keyCode == $.ui.keyCode.LEFT) 		self.prev(); 
				if(event.keyCode == $.ui.keyCode.SPACE) 	self.next(); 
				if(event.keyCode == $.ui.keyCode.END) {
					options.activeImage = options.imageArray.length-2;
					event.preventDefault();
					self.next(); 
				}
				if(event.keyCode == $.ui.keyCode.HOME) {	
					options.activeImage = 1;	
					event.preventDefault();
					self.prev(); 
				}
			});	
			options.buttonpane = options.wrapperElement.find("#ui-dialog-buttonpane");
			// check button state
			self._setButtonState();		
			
			// add events for paging and hover if necassary	
			var prev = options.buttonpane.find("#ui-lightbox-prev");
			prev.click( function() { self.prev(); });
			self._makeHover(prev);				
			var next = options.buttonpane.find("#ui-lightbox-next");
			next.click( function() { self.next(); });
			self._makeHover(next);
		}
		options.wrapperElement.keydown( function(event){ 
			if(event.keyCode == $.ui.keyCode.ESCAPE) 	self.close();
		});
		
		// add hover and close event
		var closeElement = options.wrapperElement.find("#ui-lightbox-close");
		closeElement.click( function() { self.close(); return false; });
		self._makeHover(closeElement);
		
		// decide which position is set
		if (!event && options.pos == "offset") options.pos = "auto";
		switch (options.pos) {
			case "auto":
				var viewPos = 	self._pageScroll();
				var posLeft = 	(($(document).width() - options.wrapperElement.width())/2);	
				var posTop = 	viewPos[1]+options.autoHeight;
				break;
			case "offset":
				var posLeft = 	event.pageX+options.offsetX;	
				var posTop = 	event.pageY-options.offsetY;
				break;						
			default:
				var position =  options.pos.split(",");
				var posLeft = position[0];
				var posTop = position[1];
				break;
		}		
		// set inital position, fade in and focus
		options.wrapperElement
			.css({
				left: posLeft+"px",
				top: posTop+"px"
			})
			.fadeIn(options.animationSpeed)
			.focus();
		
		// set picture and meta data
		self._changePicture(element, event);
	},
	
	// called whenever a picture should be changed
	_changePicture: function (element, event){
		var options = this.options, self = this;
		// get elements for reuse
		var contentWrapper = options.wrapperElement.find("#ui-lightbox-content");
		var imageWrapper = contentWrapper.find("#ui-lightbox-image");
		var imageElement = imageWrapper.find("img");
		
		// fade out the picture, then set new properties and animate elements
		imageElement.fadeOut(options.animationSpeed, function() {
			// ARIA | set attributes and begin manipulations
			contentWrapper
				.attr("aria-live", "assertive")
				.attr("aria-relevant", "additions removals text")
				.attr("aria-busy", true);	
				
			// preload image
			var image = new Image();
			image.onload = function() {	
				//  set new picture properties	
				imageElement
					.attr('src', element.attr("href"))
					.attr('alt', options.altText.call(element));
					
				// if em isnt deactivated calculate relative size
				var calculatedX = (options.em) ? image.width*options.em+"em" : image.width;
				var calculatedY = (options.em) ? image.height*options.em+"em" : image.height;
				// set image dimension | set always cause of display problems with relative dimension setting
				imageElement.css({
					width: calculatedX,
					height: calculatedY
				});
				// decide which position is set and animate the width of the ligthbox element
				if (!event && options.pos == "offset") options.pos = "auto";
				switch (options.pos) {
					case "offset":
						options.wrapperElement.animate({
							left: event.pageX+options.offsetX+"px",
							top: event.pageY+options.offsetY+"px",
							width: calculatedX
						}, options.animationSpeed);
						break;						
					case "auto":
					default:
						options.wrapperElement.animate({
							left: (($(document).width() - image.width)/2)+"px",
							width: calculatedX
						}, options.animationSpeed);
						break;						
				}
				// resize the hight of the image wrapper to resize the lightbox element | wait till finished
				imageWrapper.animate({ 
						height: calculatedY
					}, 	
					options.animationSpeed, 
					function () {
						// fade in the picture
						imageElement.fadeIn(options.animationSpeed);
						// change description of the picture
						options.wrapperElement.find("#ui-lightbox-description")
							.text(options.descText.call(element));
						// if it is a gallery change the pager text
						if (options.imageArray)
						options.wrapperElement.find("#ui-lightbox-pager")
							.text(options.pictureText +' '+ (options.activeImage+1) +' '+ options.ofText +' '+ options.imageArray.length);
						// check if lightbox popup changed body dimension
						if (options.useDimmer)	self._dimmerResize();
						// update screenreader buffer
						self._updateVirtualBuffer();		
						// ARIA | manipulations finished
						contentWrapper.attr("aria-busy", false);
						
						// add jQuery Address stuff
						if ($.address && options.jqAddress.enable) {
							if (options.jqAddress.title.enable) $.address.title($.address.title().split(options.jqAddress.title.split)[0] + options.jqAddress.title.split + options.altText.call(element));
							$.address.value(element.attr("href"));
						}
						
						// Callback
						self._trigger("onChangePicture", 0);
						// END of image changing
					}
				);					
				// IE specific, prevent animate gif failures | unload onload
				image.onload = function(){};
			};
			// load image
			image.src = element.attr("href");
		});	
	},	
	
	// set button attributes
	_setButtonState: function (){
		var options = this.options;
		// activate both buttons	
		options.buttonpane.find("#ui-lightbox-next, #ui-lightbox-prev")
			.removeAttr("disabled")
			.removeClass("ui-state-disabled")
			.removeClass("ui-state-focus");
		switch (options.activeImage) {
			// disable prev
			case 0:	
				options.buttonpane.find("#ui-lightbox-prev")
					.attr("disabled", "disabled")
					.removeClass("ui-state-hover")
					.addClass("ui-state-disabled");
				options.buttonpane.find("#ui-lightbox-next").focus();
				break;
			// disable next
			case options.imageArray.length-1:				
				options.buttonpane.find("#ui-lightbox-next")
					.attr("disabled", "disabled")
					.removeClass("ui-state-hover")
					.addClass("ui-state-disabled");
				options.buttonpane.find("#ui-lightbox-prev").focus();
				break;
		}		
	},
	
	// close wrappper element
	close: function (){
		var options = this.options, self = this;
		// focus back to first clicked element
		$(options.clickedElement).parent().focus();
		options.wrapperElement.fadeOut(options.animationSpeed, function () { 
			$(this).remove(); 
		});
		// remove dimmer
		if (options.useDimmer) $("#ui-lightbox-screendimmer").fadeOut(options.animationSpeed, function() { $(this).remove(); });
		// refocus original clicked element
		$(options.clickedElement).focus();
		// add jQuery Address stuff
		if ($.address && options.jqAddress.enable) {
			if (options.jqAddress.title.enable) $.address.title($.address.title().split(options.jqAddress.title.split)[0]);
			$.address.value("");
		}
		// Callback
		self._trigger("onClose", 0);
	},		
	
	// change picture to previous image
	prev: function (){
		var options = this.options, self = this;
		if(options.imageArray && options.activeImage > 0) {
			options.activeImage = options.activeImage-1;
			self._changePicture($(options.imageArray[options.activeImage]));
			self._setButtonState();
			// Callback
			self._trigger("onPrev", 0);
		}
	},	
	
	// change picture to next image
	next: function (){
		var options = this.options, self = this;
		if(options.imageArray && options.activeImage < (options.imageArray.length-1)) {
			options.activeImage = options.activeImage+1;
			self._changePicture($(options.imageArray[options.activeImage]));
			self._setButtonState();
			// Callback
			self._trigger("onNext", 0);
		}
	},
	
	// create lightbox
	_lightboxCreate: function() {	
		var options = this.options, self = this;
		// inject html
		var html = '<div id="ui-lightbox-screendimmer" style="display: none;"></div>';		
		$("body").append(html);
		// set attributes
		$("#ui-lightbox-screendimmer")
			.css({
				width: 		self._dimmerWidth() + 'px',
				height: 	self._dimmerHeight() + 'px',
				zIndex: 	options.zIndex,
				background: options.background,
				position: 	"absolute",
				top: 		"0px",
				left:		"0px",
				opacity:	options.opacity
			})
			.fadeIn(options.animationSpeed)
			// if dimmer is clicked, close lightbox
			.click( function() {
				self.close();
			});
	},
	
	// resize dimmer
	_dimmerResize: function() {
		var self = this;		
		var dimmer = $("#ui-lightbox-screendimmer");
		if (dimmer.length) {
			// make dimmer div small | necassary to check if content is smaller than the dimmer div
			dimmer.css({
				width: 	0,
				height: 0
			});		
			// check real body dimension
			var dimension = self._pageScroll();
			// if page is not scrolled without dimmer div use normal width
			var dimensionX = (dimension[0] == 0) ? self._dimmerWidth() : dimension[0];			
			dimmer.css({
				width: 	dimensionX + 'px',
				height: self._dimmerHeight() + 'px'
			});
		}
	},
	
	// get body hight
	_dimmerHeight: function() {
		// handle IE 6
		if ($.browser.msie && $.browser.version < 7) {
			var scrollHeight = Math.max(
				document.documentElement.scrollHeight,
				document.body.scrollHeight
			);
			var offsetHeight = Math.max(
				document.documentElement.offsetHeight,
				document.body.offsetHeight
			);
			if (scrollHeight < offsetHeight) {
				return $(window).height();
			} else {
				return scrollHeight;
			}
		// handle "good" browsers
		} else {
			return $(document).height();
		}
	},
	
	// get body width
	_dimmerWidth: function() {
		// handle IE 6
		if ($.browser.msie && $.browser.version < 7) {
			var scrollWidth = Math.max(
				document.documentElement.scrollWidth,
				document.body.scrollWidth
			);
			var offsetWidth = Math.max(
				document.documentElement.offsetWidth,
				document.body.offsetWidth
			);
			if (scrollWidth < offsetWidth) {
				return $(window).width();
			} else {
				return scrollWidth;
			}
		// handle "good" browsers
		} else {
			return $(document).width();
		}
	},
	
	// get scrolling of the page
	_pageScroll: function() {
		var xScroll, yScroll;
		if (self.pageYOffset) {
			yScroll = self.pageYOffset;
			xScroll = self.pageXOffset;
		// Explorer 6 Strict
		} else if (document.documentElement && document.documentElement.scrollTop) {
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		// all other Explorers
		} else if (document.body) { 
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;	
		}
		arrayPageScroll = new Array(xScroll,yScroll);
		return arrayPageScroll;
	},
	
	// make hover and focus effects
	_makeHover: function(element) {
		 element.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
				.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
				.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
				.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });
	},	
	
	// updates virtual buffer of older screenreader
	_updateVirtualBuffer: function() {
		var form = $("body>form #virtualBufferForm");		
		if(form.length) {
			(form.val() == "1") ? form.val("0") : form.val("1")
		} else {
			var html = '<form><input id="virtualBufferForm" type="hidden" value="1" /></form>';
			$("body").append(html);
		}
	},
	
	destroy: function() {
		var options = this.options;	
		
		if (options.makeHover) {	
			if (options.imageArray) {
				options.imageArray.each(function() { 
					// remove events
					$(this).unbind("mouseleave mouseenter focus blur");
				});
			} else {
				this.element.unbind("mouseleave mouseenter focus blur");
			}
		} 
		
		this.element
			// remove events
			.unbind(".ariaLightbox")
			.unbind("click")
			// remove data
			.removeData('ariaLightbox');
		
		$("body>form #virtualBufferForm").parent().remove();	
		$("body>div#ui-lightbox-screendimmer").remove();	
		$("body>div#ui-lightbox-wrapper").unbind("keydown").remove();
	}	
});
})(jQuery);