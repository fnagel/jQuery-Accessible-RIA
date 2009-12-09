/*!
 * jQuery UI FormValidator (04.12.09)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Licensed under Creative Commens Attribution-Share Alike 3.0 Unported (http://creativecommons.org/licenses/by-sa/3.0/)
 * 
 *  Depends: ui.core.js
 */
/*
USAGE:::::::::::::::::::::::::::
* Take a look in the html file or the (german) pdf file delivered with this example
 * To validate a form element specify its properties in the options forms array:
 options
	forms
		ID [of the element]
			rules
			msgs
* Forms Array and its children are necessary, possbile values for rules and msg are:
				required
				lengthMin
				lengthMax
				equalTo (id of to be checked element)
				regEx (set your own regex)
				custom (make your own validation function - the fast way)
* Use a regular expression or a predefined value for the RegEx rule:
					number
					numberDE
					numberISO
					email
					url
					plz
					dateDE
					dateISO
					captcha (this is a callback for server side validation, look example)
		
* Other widget options are:
validateLive 	Boolean	turn on or off live validation
validateTimeout	Number	time till live validation
validateOff 	String	msg for disabling live validation
validateOn 		String	msg for disabling live validation
submitHowTo 	String 	ajax, iframe (for "ajax" and file upload), post (native)
submitUrl 		String 	url for ajax and iframe submition
submitError 	String 	predefined error msg
submitSuccess 	String 	predefined succes msg
disabled 		Boolean 	disable widget

* Callbacks
onInit
onformSubmitted
onShowErrors
onShowSuccess (returns true or a string)
checkCaptcha (must deliver a boolean value)

* public Methods
disable
destroy
enable
formSubmitted	submits the form	
 
 */
(function($) {

$.widget("ui.formValidator", {

	_init: function() {	
		var options = this.options, self = this;
		
		// add virtual budder form | should be added immediatly
		self._updateVirtualBuffer();
		
		// set sumitUrl to form action if no one is defined
		if (options.submitUrl == "") options.submitUrl = self.element.attr("action");
		
		// prevent submitting the form
		self.element.submit( function (event) {	
			// check if widget is disabled or temp set to disabled by script cause we need to post data
			if (!options.disabled) {
				//event.preventDefault();
				self.formSubmitted();
			}
			return options.disabled;
			
		});
		// add info Text and provide link to prevent live validating
		if(options.validateLive && !options.disabled) {
			// add the deactivate live validation message
			self.element.find("#ui-formular-info").append("\t<p><a id=\"ui-formular-live\" href=\"#nogo\">"+ options.validateOff +"</a></p>\n\t\t");
			
			self._updateVirtualBuffer();
		
			// toggle live validating and text of the link
			self.element.find("#ui-formular-live").toggle(
				function () {
					options.validateLive = false;
					$(this).attr("aria-live","polite")
					.attr("aria-relevant","text")
					.html(options.validateOn);
					self._updateVirtualBuffer();
				},
				function () {
					options.validateLive = true;
					$(this).attr("aria-live","polite")
					.attr("aria-relevant","text")
					.html(options.validateOff);
					self._updateVirtualBuffer();
				}
			);
		}
		// set hover and focus for reset and submit buttons 
		self._makeHover(self.element.find("input:submit, input:reset"));
		
		// get the error array	
		errors = self.options.errorsArray;
		
		// go trough every given form element
		$.each(options.forms, function(id){
			// instance the associative arry with index = id of the form element
			errors[id] = [];
			
			// save element and which form type | add event handler | ARIA
			//  search for "single" elements (which sould be defined by their ID)
			var element = self.element.find("#"+id);
			//check if radio group or checkbox group or single checkbox (which sould be defined by their class)
			if (!element.length) {
				// get all group elements
				element = self.element.find("input."+id);	
				// no element found? Only developers should see this
				if (!element.length) {
					alert("Error: Configuration corrupted!\n\nCan't find element with id or class = "+id);
				} else {
					value = "group";
					// change label class when hover the label
					self._makeHover(element.next()); 
					// change label class when hover the form element
					element.bind("mouseenter", function(){ $(this).next().addClass('ui-state-hover'); })
						.bind("mouseleave", function(){ $(this).next().removeClass('ui-state-hover'); })
						.bind("focus", function(){ $(this).next().addClass('ui-state-focus'); })
						.bind("blur", function(){ $(this).next().removeClass('ui-state-focus'); });
				}
			} else {
				// form element hover
				self._makeHover(element);
				// ARIA
				if (options.forms[id].rules.required) {
					element.attr("aria-required", true);
				}
				if (element[0].nodeName.toLowerCase() == "select") {
					// element is a selectfield
					value = "select";
				} else {
					// normal textinput or textarea or file upload
					value = "single";
				}
			}
			// save info
			options.forms[id].element = element;
			options.forms[id].type = value;
			
			
			// dont bind events if live validation is disabled	
			if (options.validateLive) {
				// necessary for not getting too much events
				if (options.forms[id].type != "group") {
					var eventBinder = "keyup";
					// options need change events
					if (options.forms[id].type == "select") eventBinder = "change";
				} else {
					var eventBinder = "change";
				}
				// add event listener
				options.forms[id].element.bind(eventBinder, function () {
					// look up if live validation is turned off or widget is disabled
					if (options.validateLive && !options.disabled) {
						// delete old timeout
						if(options.forms[id].timeout) window.clearTimeout(options.forms[id].timeout);	
						// extend timeout to prevent server overload
						if (id == "captcha"){
							var time = options.validateTimeout*3;
						} else {
						var time = options.validateTimeout;
						}
						// wait before fire event
						options.forms[id].timeout = window.setTimeout(function() {
							self._validator(options.forms[id].element, id, errors);	
							self._showErrors(false);	
						}, time);
					}
				});
			}
		});	
		// save empty errors array
		options.errorsArray = errors;
		// Callback
		self._trigger("onInit", 0);
	},
	
	// called when interact with the form | validates the forms | manages which rule applies to which element
	_validator: function(element, id, errors) {
		var options = this.options, self = this;
		// get value of the form element(s)
		var elementValue = self._getValue(id);	
		
		// got trough every rule and its ruleValue of every given form element 
		$.each(options.forms[id].rules, function(rule, ruleValue){
			if (elementValue == "") {
				// unset required error if no form value given and form is not required
				if (rule != "required") errors[id][rule] = self._whichError(true, errors[id][rule]);
				// if form is required set error
				if (rule == "required" && ruleValue) errors[id][rule] = self._whichError(false, errors[id][rule]);
			} else {
				// unset required error if form has some value
				if (rule == "required" && ruleValue) errors[id][rule] = self._whichError(true, errors[id][rule]);
				switch (rule) {
					case "regEx":
						switch (ruleValue) {
							case "number":
								errors[id][rule] = self._whichError(self._number(elementValue), errors[id][rule]);
								break;
							case "numberDE":
								errors[id][rule] = self._whichError(self._numberDE(elementValue), errors[id][rule]);
								break;
							case "numberISO":
								errors[id][rule] = self._whichError(self._numberISO(elementValue), errors[id][rule]);
								break;
							case "email":
								errors[id][rule] = self._whichError(self._email(elementValue), errors[id][rule]);
								break;
							case "url":
								errors[id][rule] = self._whichError(self._url(elementValue), errors[id][rule]);
								break;
							case "plz":
								errors[id][rule] = self._whichError(self._plz(elementValue), errors[id][rule]);
								break;
							case "dateDE":
								errors[id][rule] = self._whichError(self._dateDE(elementValue), errors[id][rule]);
								break;
							case "dateISO":
								errors[id][rule] = self._whichError(self._dateISO(elementValue), errors[id][rule]);
								break;
							case "captcha":
								errors[id][rule] = self._whichError(self._captcha(elementValue), errors[id][rule]);
								break;
							// regular expression
							default:
								errors[id][rule] = self._whichError(self._regEx(elementValue, ruleValue), errors[id][rule]);
								break;
						}
						break;
					case "lengthMin":
						errors[id][rule] = self._whichError(self._lengthMin(elementValue, ruleValue), errors[id][rule]);
						break;
					case "lengthMax":
						errors[id][rule] = self._whichError(self._lengthMax(elementValue, ruleValue), errors[id][rule]);
						break;
					case "equalTo":
						errors[id][rule] = self._whichError(self._equalTo(elementValue, ruleValue), errors[id][rule]);
						break; 
					case "custom":
                        errors[id][rule] = self._whichError(ruleValue(elementValue), errors[id][rule]);
					   break;
				}		
			}
		});
		// save errors
		self.options.errorsArray = errors;
	},
	
	// called when form is submitted
	formSubmitted: function() {
		var options = this.options, self = this;
		// Callback
		self._trigger("onformSubmitted", 0);	
		
		// delete success or error message 
		self.element.find("#ui-formular-success").remove();
		
		// get errors array
		errors = self.options.errorsArray;
		
		// got trough every given form element 
		$.each(options.forms, function(id){
			// is a group of radio buttons or checkboxes already validated?
			var groupValidated = false;
			// check if the defined id elements exist in the DOM
			//var element = self.element.find("#"+id);
			var element = options.forms[id].element;
			if (options.forms[id].type == "single")  {
				self._validator(element, id, errors);	
			// if not it must be a radiobox group or a checkbox group				
			} else {
				// check if the is already validated
				if (!groupValidated) {
					groupValidated = true;
					self._validator(element, id, errors);
				}
			}
		});		
		
		self._showErrors(true);	
	},
	
	// called when forms are validated | write errorsArray to DOM | Take care of ARIA
	_showErrors: function(submitted){	
		var options = this.options, self = this;
		var isError, addError, removeError = false;
		var msgs = msg = "";		
		// get error array
		var errors = self.options.errorsArray;
		
		// got trough every error form element 
		for (var id in errors){
			// needed to ensure error Class isnt removed if required error still exists
			var failure = false;
			for (var rule in errors[id]){	
				// set error as corrected
				if (errors[id][rule] == "corrected") {
					var target = options.forms[id].element;
					// ARIA
					target.attr("aria-invalid", false);					
					// check for radio group or checkbox group
					if (options.forms[id].type == "group") {
						target = target.next();
					} 
					// unhighlight error field
					target.removeClass("ui-state-error");
					// ARIA: old error deleted
					removeError = true;
				}	
				if(errors[id][rule] == "new" || errors[id][rule] == "old") {
					switch (rule) {
						case "required":
							msg = options.forms[id].msg.required;
							break;
						case "regEx":
							msg = options.forms[id].msg.regEx;
							break;
						case "lengthMin":
							msg = options.forms[id].msg.length;
							break;
						case "lengthMax":
							msg = options.forms[id].msg.length;
							break;
						case "equalTo":
							msg = options.forms[id].msg.equalTo;
							break;
						case "custom":
                            msg = options.forms[id].msg.custom;
                            break;
					}
					msgs += '					<li><a href="#'+id+'">'+msg+"</a></li>\n";
					// there are errors to show
					isError = failure = true;
				}
				if(errors[id][rule] == "new") {
					// ARIA: new error added
					addError = true;				
				}				
			}
			// check at last if there is an error so error class wont be removed
			if (failure) {
				var target = options.forms[id].element;			
				target.attr("aria-invalid", true);					
				// check for radio group or checkbox group
				if (options.forms[id].type == "group") {
					target = target.next();
				} 
				// unhighlight error field
				target.addClass("ui-state-error");
			}			
		}		
		// take care of ARIA
		var aria = ' aria-live="assertive"';
		if (addError || removeError) aria += ' aria-relevant="text';
		if (addError) aria += ' additions';
		if (removeError) aria += ' removals';
		if (addError || removeError) aria += '"';	
		
		// build up HTML | no content if no error is found
		var html = "\n"
		if (isError) {
			html += '			<div'+aria+' class="info ui-state-highlight ui-state ui-corner-all">'+"\n";
			html += '				<p id="ui-error-title">'+"\n";
			html += '					<span class="ui-icon ui-icon-alert" style="float: left; margin-right: 0.3em;"></span>'+"\n";
			html += '					'+options.errorsTitle+"\n";
			html += '				</p>'+"\n";
			html += '				<ul aria-labelledby="ui-error-title">'+"\n";
			html += msgs;
			html += '				</ul>'+"\n";
			html += '			</div>'+"\n\t\t";
		}
		// inject error HTML and make onclick event for direct error correction
		errorElement = self.element.find("#ui-formular-error");
		errorElement.html(html);
		
		// no click events if no error is defined
		if (isError) {
			// set link anchor to form
			errorElement.find("a").click(function(event){
				event.preventDefault();
				// get id out of the href anchor				
				var id = $(this).attr("href").split("#");
				id = id[1];
				// focus element or first element of a group
				if(options.forms[id].type == "single") {
					var target = options.forms[id].element;
				} else {
					var target = options.forms[id].element[0];
				}
				target.focus();
			});
			// focus error box when form is submitted
			if (submitted) errorElement.attr("tabindex",-1).focus();
		// send data if no errors found
		} else if(submitted) {
			self._sendForm();
		}
		
		self._updateVirtualBuffer();		
		
		// Callback
		self._trigger("onShowErrors", 0);
	},
	
	// send form
	_sendForm: function() {
		var options = this.options, self = this;
		
		switch (options.submitHowTo) {
			case "post":
				// prevents revalidating but activates native form event
				options.disabled = true;
				// fire native form event
				self.element.submit();
				break;
			case "ajax":
				$.ajax({ // AJAX Request auslösen
					data: self.element.serialize(),
					type: "post",
					url: options.submitUrl,
					error: function(msg) {
						self._showSuccess(msg);
					},
					success: function(msg) { 
						self._showSuccess(msg);
					}
				});
				break;
			case "iframe":
				// save url the form would be submitted
				options.originalUrl =  self.element.attr("action");
				// change action to ajax server adress
				self.element.attr("action", options.submitUrl)	
				// inject iframe				
				var frameName = ("upload"+(new Date()).getTime());
				var uploadFrame = $('<iframe name="'+frameName+'"></iframe>');
				uploadFrame.css("display", "none");
				// when iframe is loaded get content
				uploadFrame.load(function(data){
					self._showSuccess($(this).contents().find("body").html());
					// wait till DOM is ready
					options.timeout = window.setTimeout(function() {
						uploadFrame.remove();	
					}, 200);
				});		
				$("body").append(uploadFrame);
				// submit the form into the iframe
				self.element.attr("target", frameName);				
				// prevents revalidating but activates native form event
				options.disabled = true;
				// fire native form event
				self.element.submit();
				break;
		}
	},
	
	// called when form is submitted
	_showSuccess: function(value) {
		var options = this.options, self = this;
		var msg = "", icon = "";
		// reenable the widget 
		options.disabled = false;
		
		// chose icon to show | choose message
		switch (value) {
			case "true":
			case "1":
				msg = options.submitSuccess;
				icon = "check";
				break;
			default: 
				if (value == "") msg = options.submitError;
				else msg = value;
				icon = "alert";
				break;
		}
		
		//build up HTML
		var html = "\n"
		html += '		<div id="ui-formular-success">'+"\n";
		html += '			<div aria-live="assertive" class="info ui-state-highlight ui-state ui-corner-all">'+"\n";
		html += '				<p>'+"\n";
		html += '					<span class="ui-icon ui-icon-'+icon+'" style="float: left; margin-right: 0.3em;"></span>'+"\n";
		html += '					'+msg+"\n";
		html += '				</p>'+"\n";
		html += '			</div>'+"\n\t\t";
		html += '		</div>'+"\n\t\t";
		self.element.prepend(html); 
		self.element.find("#ui-formular-success").attr("tabindex",-1).focus();	
		self._updateVirtualBuffer();
		// Callback
		self._trigger("onShowSuccess", null, value);
	},
	
	// decides if error is new, old or corrected
	_whichError: function(error, array) {	
		var value = "";
		if (!error) {
			if (array == "new" || array == "old") { 
				value = "old"; 
			} else { 
				value = "new";
			}
		} else if (array == "new" || array == "old" ) { 
			value = "corrected";
		} else if (array == "corrected") { 
			value = "";
		}
		return value;
	},
	
	// how many checked / selected options | which value
	_getValue: function(id) {
		var options = this.options, self = this;
		var type = options.forms[id].type;
		var value = "";
		switch(type) {
			case "single":
					value = options.forms[id].element.val();
				break;
			case "group":
					var result = options.forms[id].element.filter(':checked');
					value = (result.length) ? result : "";	
				break;
			case "select":
					var result = options.forms[id].element.find("option").filter(':selected');
					value = (result.length) ? result : "";
				break;
		}
		return value;
	},	
	
	// make hover and focus effects
	_makeHover: function(element) {
		 element.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
				.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
				.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
				.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });
	},	
	
	// Validators (return true when correct)
	_regEx: function(elementValue, pattern) {
		pattern = new RegExp(pattern);
		return pattern.test(elementValue);
	},
	_number: function(elementValue) {
		return /^\d+$/.test(elementValue);
	},
	_numberDE: function(elementValue) {
		return /^[-+]?([0-9]*\,)?[0-9]+$/.test(elementValue);
	},
	_numberISO: function(elementValue) {
		return /^[-+]?([0-9]*\.)?[0-9]+$/.test(elementValue);
	},
	_email: function(elementValue) {
		return /^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/.test(elementValue);
	},
	_url: function(elementValue) {
		return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(elementValue);
	},
	_plz: function(elementValue) {
		return /^\b((?:0[1-46-9]\d{3})|(?:[1-357-9]\d{4})|(?:[4][0-24-9]\d{3})|(?:[6][013-9]\d{3}))\b$/.test(elementValue);
	},
	_dateDE: function(elementValue) {
		return /^\d\d?\.\d\d?\.\d\d\d?\d?$/.test(elementValue);
	},
	_dateISO: function(elementValue) {
		return /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(elementValue);
	},
	_lengthMin: function(elementValue, ruleValue) {
		return (elementValue.length >= ruleValue) ? true : false;
	},
	_lengthMax: function(elementValue, ruleValue) {
		return (elementValue.length <= ruleValue) ? true : false;
	},
	_equalTo: function(elementValue, ruleValue) {
		return (elementValue == $("#"+ruleValue).val()) ? true : false;
	},	
	_captcha: function(elementValue, ruleValue) {
		return this._trigger("checkCaptcha", null, elementValue);
	},		
	
	// removes instance and attributes
	destroy: function() {
		var options = this.options;		
		// go trougfh every form element
		$.each(options.forms, function(id){
			options.forms[id].element
				.removeClass("ui-state-error")
				.removeClass("ui-state-hover")
				.removeAttr("aria-invalid")
				.removeAttr("aria-required")
				// remove events
				.unbind();
			if (options.forms[id].type == "group") {
				options.forms[id].element.next()
					.removeClass("ui-state-error")
					.removeClass("ui-state-hover")
					.removeAttr("aria-invalid")
					.removeAttr("aria-required")
					// remove events
					.unbind();
			} 
		});		
		this.element
			// remove events
			.unbind(".formValidator")
			.unbind("submit")
			// remove data
			.removeData('formValidator');
			
		// set original action url if changed
		if (options.originalUrl != "") this.element.attr("action", options.originalUrl)
		// remove injected elements
		this.element.find("#ui-formular-live, ##ui-formular-error, #ui-formular-success").remove();	
		$("#virtualBufferForm").parent().remove();	
	},	
	
	// updates virtual buffer | for older screenreader
	_updateVirtualBuffer: function() {
		var form = $("#virtualBufferForm");		
		if(form.length) {
			(form.val() == "1") ? form.val("0") : form.val("1")
		} else {
			var html = '<form><input id="virtualBufferForm" type="hidden" value="1" /></form>';
			$("body").append(html);
		}
	}
});

$.extend($.ui.formValidator, {
	version: "1.7.1",
	defaults: {
		validateLive: true,
		validateTimeout: 500,
		validateOff: "Bitte klicken Sie hier um die Live Validierung zu deaktivieren.",
		validateOn: "Bitte klicken Sie hier um die Live Validierung zu aktivieren.",
		errorsTitle: "Bitte korrigieren Sie folgende Fehler:",		
		submitHowTo: "ajax",
		submitUrl: "",
		submitError: "Bei der Datenübertragung ist ein Fehler aufgetreten. Entschuldigen Sie bitte und versuchen Sie es noch einmal.",
		submitSuccess: "Die Daten wurden erfolgreich übermittelt. Vielen Dank!",		
		//do not alter these vars
		errorsArray: [],
		originalUrl: ""
	}
});

})(jQuery);