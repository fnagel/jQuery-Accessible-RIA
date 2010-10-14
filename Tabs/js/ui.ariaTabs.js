/*!
 * jQuery UI AriaTabs (14.10.10)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Copyright (c) 2010 Felix Nagel
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends: ui.core.js 1.8.x
 *   		ui.tabs.js
 */ 
/* 
 USAGE:::::::::::::
* Take a look in the html file or the (german) pdf file delivered with this example
* Simply add the js file uner the regular ui.tabs.js script tag
* Supports all options, methods and callbacks of the original widget
* sortable tabs are accessable but the sortable functionality as it is provided by the ui.sortable widget doesnt support ARIA 

 * Options	
jqAddress			You need to add the add the jQuery Address file, please see demo file!
	enable			enable browser history support
	title
		enable		enable title change
		split		set delimiter string
 
*/
(function($) {
	$.fn.extend($.ui.tabs.prototype,{
	
		// when widget is initiated
		_create: function() {
			var self = this, options = this.options;	
			// add jQuery address default options
			if ($.address) {						
				var jqAddressDefOpt = { 
					enable: true,
					title: {
						enable: true,
						split: ' | '		
					}
				};			
				if (!$.isEmptyObject(options.jqAddress)) $.extend(true, jqAddressDefOpt, options.jqAddress );
				else options.jqAddress = {};
				$.extend(true, options.jqAddress, jqAddressDefOpt);
			}

			// add jQuery Address stuff
			if ($.address && options.jqAddress.enable) var anchorId = "#" + $.address.value().replace("/", '');

			// fire original function
			self._tabify(true);		
			
			// accessibility: needed to prevent blur() when enter key is pushed to enable forms mode in screenreader
			// needs to be fixed in tabs widget in line 333
			this.anchors.bind(options.event + '.tabs-accessibility', function() { this.focus(); });
			
			
			// ARIA
			// self.element.attr("role", "application");
			self.list.attr("role", "tablist");	
			for (var x = 0; x < self.anchors.length; x++) {
				// add jQuery Address stuff | get proper tab by anchor
				if ($.address && options.jqAddress.enable && anchorId != "#" && $(self.anchors[x]).attr("href") == anchorId) self.select(x);
				// init aria atrributes for each panel and anchor
				self._ariaInit(x);
			}	
			
			// keyboard
			self.list.keydown( function(event){
				switch (event.keyCode) {
					case $.ui.keyCode.RIGHT:
						self.select(options.selected+1);
						return false;
						break;
					case $.ui.keyCode.DOWN:
						self.select(options.selected+1);
						// FIXME issues with NVDA: down key is needed for reading content
						// return false;
						break;
					case $.ui.keyCode.UP:
						self.select(options.selected-1);
						return false;
						break;
					case $.ui.keyCode.LEFT:
						self.select(options.selected-1);
						return false;
						break;
					case $.ui.keyCode.END:
						self.select(self.anchors.length-1);
						return false;
						break;
					case $.ui.keyCode.HOME: 
						self.select(0);
						return false;
						break;				
				}
			});		
			
			// add jQuery address stuff
			if ($.address && this.options.jqAddress.enable) {
				$.address.externalChange(function(event) {
					// Select the proper tab
					var anchorId = "#" + event.value.replace("/", '');
					var x = 0;
					while (x < self.anchors.length) {
						if ($(self.anchors[x]).attr("href") == anchorId) {
							self.select(x); 
							return;
						}
						x++;						
					}	
				});
			}
		},
		
		_original_load: $.ui.tabs.prototype.load,
		// called whenever a tab is selected but if option collapsible is set | fired once at init for the chosen tab
		load: function(index) {	
			
			// add jQuery Address stuff
			// workaround: only set values when user interacts aka not on init
			if ($.address && this.options.jqAddress.enable) {
				if ($(this.anchors[0]).attr("aria-selected") !== undefined) {
					if (this.options.forceFirst === 0 && index !== 0) {
						// if there is no anchor to keep, prevent double entry
						if ($.address.value() == "") $.address.history(false);
						$.address.value($(this.anchors[0]).attr("href").replace(/^#/, ''));
						$.address.history(true);
						this.options.forceFirst = false;
					}
					if (this.options.jqAddress.title.enable) $.address.title($.address.title().split(this.options.jqAddress.title.split)[0] + this.options.jqAddress.title.split + $(this.anchors[index]).text());
					$.address.value($(this.anchors[index]).attr("href").replace(/^#/, ''));
				} else {
					this.options.forceFirst = index;
				}
			}
			
			// hide all unselected
			for (var x = 0; x < this.anchors.length; x++) {			
				// anchors
				this._ariaSet(x, false);
				// remove ARIA live settings
				if($.data(this.anchors[x], 'href.tabs')) {
					$(this.panels[x])
						.removeAttr("aria-live")
						.removeAttr("aria-busy");
				}
			};	
			// is remote? set ARIA states 
			if($.data(this.anchors[index], 'href.tabs')) {
				$(this.panels[index])
					.attr("aria-live", "polite")
					.attr("aria-busy", "true");
			}		
			// fire original function
			this._original_load(index);
						
			// is remote? end ARIA busy
			if($.data(this.anchors[index], 'href.tabs')) {
				$(this.panels[index])
					.attr("aria-busy", "false");				
					// TO DO jQuery Address: title is wrong when using Ajax Tab
			}			
			// set state for the activated tab
			this._ariaSet(index, true);
		},
		
		// sets aria states for single tab and its panel
		_ariaSet: function(index, state) {		
			var tabindex = (state) ? 0 : -1;
			var anchor = $(this.anchors[index]);
			// set ARIA state for loaded tab			
			anchor.attr("tabindex", tabindex)
				.attr("aria-selected", state);
			// set focus and remove focus CSS class
			if (state) {
				if (!$.browser.msie) anchor.focus(); 
			} else {
				// needed to remove CSS class set by original widget
				anchor.closest("li").removeClass("ui-state-focus");			
			}
			// set ARIA state for loaded tab
			$(this.panels[index])
				.attr("aria-hidden", !state)
				.attr("aria-expanded", state);
			// accessibility: needed to prevent blur() because IE loses focus when using keyboard control
			// this needs rto be fixed in jQuery UI Tabs in line 402
			if ($.browser.msie) this.options.timeout = window.setTimeout(function() { anchor.focus(); }, 100);
			// update virtual Buffer
			if (state) this._updateVirtualBuffer();
		},
		
		// sets all attributes when plugin is called or if tab is added
		_ariaInit: function(index) {
			var self = this;
			// get widget generated ID of the panel
			var panelId = $(this.panels[index]).attr("id");		
			// ARIA anchors and li's
			$(this.anchors[index])
				.attr("aria-controls", panelId)
				.attr("id", panelId+"-tab")
			// set role to the li not the a because of NVDA tabindex issue
			.parent().attr("role", "tab");				
			// ARIA panels aka content wrapper
			$(this.panels[index])
				.attr("role", "tabpanel")
				// add tabpanel to the tabindex
				.attr("tabindex", 0)
				.attr("aria-labelledby", panelId+"-tab");				
			// if collapsible, set event to toggle ARIA state
			if (this.options.collapsible) {
				$(this.anchors[index]).bind(this.options.event, function(event) {
					// get class to negate it to set states correctly when panel is collapsed
					self._ariaSet(index, !$(self.panels[index]).hasClass("ui-tabs-hide"));
				});
			}
		},		
		
		_original_add: $.ui.tabs.prototype.add,
		// called when a tab is added
		add: function(url, label, index) {
			// fire original function
			this._original_add(url, label, index);
			// ARIA			
			this.element
				.attr("aria-live", "polite")
				.attr("aria-relevant","additions");
			
			// if no index is defined tab should be added at the end of the tab list
			if (index) {
				this._ariaInit(index);
				this._ariaSet(index, false);
			} else {
				this._ariaInit(this.anchors.length-1);
				this._ariaSet(this.anchors.length-1, false);
			}			
		},
		
		_original_remove: $.ui.tabs.prototype.remove,
		// called when a tab is removed
		remove: function(index) {
			// fire original function
			this._original_remove(index);	
			// ARIA
			this.element
				.attr("aria-live", "polite")
				.attr("aria-relevant","removals");
		},		
		
		_original_destroy: $.ui.tabs.prototype.destroy,
		// removes all the setted attributes
		destroy: function() {
			var self = this, options = this.options;
			// remove ARIA attribute
			// wrapper element
			self.element
				.removeAttr("role")
				.removeAttr("aria-live")
				.removeAttr("aria-relevant");
			// ul element
			self.list.removeAttr("role");		
			for (var x = 0; x < self.anchors.length; x++) {
				// tabs
				$(self.anchors[x])
					.removeAttr("aria-selected")
					.removeAttr("aria-controls")
					.removeAttr("role")
					.removeAttr("id")
					.removeAttr("tabindex")
				// remove presentation role of the li element
				.parent().removeAttr("role");
				// tab panels
				$(self.panels[x])
					.removeAttr("aria-hidden")
					.removeAttr("aria-expanded")
					.removeAttr("aria-labelledby")
					.removeAttr("aria-live")
					.removeAttr("aria-busy")
					.removeAttr("aria-relevant")
					.removeAttr("role");
			}
			// remove virtual buffer form
			$("body>form #virtualBufferForm").parent().remove();
			// fire original function
			this._original_destroy();	
		},
	
		// updates virtual buffer | for older screenreader
		_updateVirtualBuffer: function() {
			var form = $("body>form #virtualBufferForm");		
			if(form.length) {
				if (form.val() == "1") form.val("0"); else  form.val("1");
				if (form.hasClass("ui-accessibility-odd")) form.addClass("ui-accessibility-even").removeClass("ui-accessibility-odd");
				else form.addClass("ui-accessibility-odd").removeClass("ui-accessibility-even");
			} else {
				$("body").append('<form><input id="virtualBufferForm" type="hidden" value="1" /></form>');
			}
		}
	});
})(jQuery); 
