/*!
 * jQuery UI FormValidator (03.05.12)
 * http://github.com/fnagel/jQuery-Accessible-RIA
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Copyright (c) 2010-2012 Felix Nagel
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Depends: jQuery UI
 */
/*
USAGE:::::::::::::::::::::::::::
* Take a look in the html file or the (german) pdf file delivered with this example
* To validate a form element specify its properties in the options forms array:
 options
	forms
		ID [or class of the element]
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
validateLive 			Boolean / String	turn on or off live validation;
validateLiveMsg			Boolean				Disable the "click here to disable live validation" message
validateTimeout			Number / String		time till live validation, use "blur" to validate on lost focus
validateTimeoutCaptcha	Number				multiplied with validateTimeout to protect your server from to much load
validateOff 			String				msg for disabling live validation
validateOn 				String				msg for disabling live validation
errorSummery			Boolean				deactivate error summery
submitHowTo 			String 				ajax, iframe (for "ajax" and file upload), post (native)
submitUrl 				String 				url for ajax and iframe submition
submitError 			String 				predefined error msg
submitSuccess 			String 				predefined succes msg
disabled 				Boolean 			disable widget
selectDefault			String				Define default value when using select options

* Callbacks
onInit
onformSubmitted
onError
onErrors
customError			returns a array with all information about the currectly validated element
onShowErrors
onShowSuccess 		returns true or a string
checkCaptcha 		must deliver a boolean value

* public Methods
disable
destroy
enable
initField			parameter is string (name of added field); adds events and internal vars for validation
formSubmitted		submits the form
validate 			parameter is string (id attribut); validates a single form element

 */
(function($) {

$.widget("ui.formValidator", {

	version: '1.8',
	options: {
		validateLive: true,
		validateLiveMsg: true,
		validateTimeout: 500, // or "blur"
		validateTimeoutCaptcha: 3,
		validateOff: "Please click here to deactivate live validating of this form.",
		validateOn: "Please clkick here to activate live form validating.",
		errorSummery: true,
		errorsTitle: "Please check the following errors:",
		submitHowTo: "post",
		submitUrl: "",
		submitError: "Something wen't wrong while sending your data. Please retry.",
		submitSuccess: "Your data was succefully submitted, thank you!",
		selectDefault: "default",
		noHover: false
	},

	_create: function() {
		var options = this.options, self = this;
		// add virtual buffer form | should be added immediatly
		self._updateVirtualBuffer();

		// set UID for later usage
		options.uid = self.element.attr("id") || Math.random().toString(16).slice(2, 10);

		// set sumitUrl to form action if no one is defined
		if (options.submitUrl == "") options.submitUrl = self.element.attr("action");

		// prevent submitting the form
		self.element.submit( function (event) {
			// check if widget is disabled or temp set to disabled by script cause we need to post data
			if (!options.disabled) {
				self.formSubmitted();
			}
			return options.disabled;

		});
		// add info Text and provide link to prevent live validating
		if(options.validateLive && !options.disabled && options.validateLiveMsg) {
			// add the deactivate live validation message
			self.element.find(".ui-formular-info").append("\t<p><a class=\"ui-formular-live\" href=\"#nogo\">"+ options.validateOff +"</a></p>\n\t\t");

			self._updateVirtualBuffer();

			// toggle live validating and text of the link
			self.element.find(".ui-formular-live").toggle(
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

		// show error summery if enabled or only when form is submitted
		this.errorElement = self.element.find(".ui-formular-error");
		if (options.errorSummery && this.errorElement.length) {
			// set link anchor to form
			this.errorElement.click(function(event){
				// get id out of the href anchor
				var id = $(event.target).closest("a").attr("href").split("#");
				id = id[1];
				// focus element or first element of a group
				var target = (options.forms[id].type == "single") ? options.forms[id].element : options.forms[id].element[0];
				target.focus();
				return false;
			});
		} else {
			options.errorSummery = false;
		}

		// set hover and focus for reset and submit buttons
		if (!options.noHover) self._makeHover(self.element.find("input:submit, input:reset"));

		// go trough every given form element
		$.each(options.forms, function(id){
			self.initField(id);
		});

		// Callback
		self._trigger("onInit", 0);
	},

	// init a form field (events, hover effects, internal vars)
	initField: function(id) {
		var options = this.options, 
			self = this;
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
				if (!options.noHover) {
					self._makeHover(element.next());
					// change label class when hover the form element
					element.bind("mouseenter", function(){ $(this).next().addClass('ui-state-hover'); })
						.bind("mouseleave", function(){ $(this).next().removeClass('ui-state-hover'); })
						.bind("focus", function(){ $(this).next().addClass('ui-state-focus'); })
						.bind("blur", function(){ $(this).next().removeClass('ui-state-focus'); });
				}
			}
		} else {
			// form element hover
			if (!options.noHover) self._makeHover(element);
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

		// we use blur as default, as we like to get a validation when a user leave a field empty when tabbing trough
		var eventBinder = "blur ";
		// which events should be set? only blur event?
		if (options.validateTimeout != "blur") {
			// necessary for not getting too much events
			if (options.forms[id].type != "group") {
				// selectboxes need all these events cause of IE (click with UI 1.8.x) and Chrome (change)
				// please note that single slectboxes (size=1) handled different than multiple, thats why we need keyup
				// this could be more effecient one day... (i will wait till UI 1.7.1 is not longer used)
				// text input and textarea get only keyup
				eventBinder +=  (options.forms[id].type == "select") ? "click change keyup" : "keyup";
			} else {
				// radio buttons and checkboxes get this event
				eventBinder += "click";
			}
		}
		// add event listener
		// we always add the blur event, so a required field left empty triggers an error
		options.forms[id].element.bind(eventBinder, function (e) {
			// dont fire events if live validation or widget or form field is disabled
			if (options.validateLive && !options.disabled) {
				// if tab is pushed do not validate immediatly || if the event is blur do not use timeout
				if (options.validateTimeout == "blur" || e.type == "blur") {
					// needed to make clicking on error anchors work
					window.setTimeout(function() {
						self.validate(id);
					}, 150);
				} else if (e.keyCode != $.ui.keyCode.TAB) {
					// delete old timeout
					if(options.forms[id].timeout) window.clearTimeout(options.forms[id].timeout);
					// extend timeout to prevent server overload
					var time = (options.forms[id].rules["regEx"] == "captcha") ? options.validateTimeout*options.validateTimeoutCaptcha : options.validateTimeout;
					// wait before fire event
					options.forms[id].timeout = window.setTimeout(function() {
						self.validate(id);
					}, time);
				}
			}
		});
	},

	// called when interact with the form | validates the forms | manages which rule applies to which element
	_validator: function(id) {
		var options = this.options, 
			self = this;
		// do nothing if field is disabled
		if (!options.forms[id].disabled) {
			// get or make error array
			var errors = (options.forms[id].errors) ? options.forms[id].errors : [];
			// get value of the form element(s)
			var elementValue = self._getValue(id);
			// got trough every rule and its ruleValue of every given form element
			$.each(options.forms[id].rules, function(rule, ruleValue){
				if (elementValue == "") {
					// unset required error if no form value given and form is not required
					if (rule != "required") errors[rule] = self._whichError(true, errors[rule]);
					// if form is required set error
					if (rule == "required" && ruleValue) errors[rule] = self._whichError(false, errors[rule]);
				} else {
					// unset required error if form has some value
					if (rule == "required" && ruleValue) errors[rule] = self._whichError(true, errors[rule]);
					switch (rule) {
						case "regEx":
							var number = "";
							switch (ruleValue) {
								case "number":
								case "numberDE":
								case "numberISO":
								case "email":
								case "url":
								case "plz":
								case "dateDE":
								case "dateISO":
								case "captcha":
									number = self['_' + ruleValue](elementValue);
									break;
								// regular expression
								default:
									number = self._regEx(elementValue, ruleValue);
									break;
							}
							errors[rule] = self._whichError(number, errors[rule]);
							break;
						case "lengthMin":
							errors[rule] = self._whichError(self._lengthMin(elementValue, ruleValue), errors[rule]);
							break;
						case "lengthMax":
							errors[rule] = self._whichError(self._lengthMax(elementValue, ruleValue), errors[rule]);
							break;
						case "equalTo":
							errors[rule] = self._whichError(self._equalTo(elementValue, ruleValue), errors[rule]);
							break;
						case "custom":
							errors[rule] = self._whichError(ruleValue(elementValue), errors[rule]);
						   break;
					}
				}
			});
			// save errors
			options.forms[id].errors = errors;
		}
		// callback for customized error messages
		options.forms[id]["id"] = id;
		self._trigger("customError", 0, options.forms[id]);
	},

	// called when form is submitted
	formSubmitted: function() {
		var options = this.options, self = this;
		// Callback
		self._trigger("onformSubmitted", 0);

		// delete success or error message
		self.element.find(".ui-formular-success").remove();

		// got trough every given form element
		$.each(options.forms, function(id){
			// is a group of radio buttons or checkboxes already validated?
			var groupValidated = false;
			// check if the defined id elements exist in the DOM
			if (options.forms[id].type == "single")  {
				self._validator(id);
			// if not it must be a radiobox group or a checkbox group
			} else {
				// check if the is already validated
				if (!groupValidated) {
					groupValidated = true;
					self._validator(id);
				}
			}
		});
		self._setErrors(true);
	},

	// validates a single element
	validate: function(id) {
		var options = this.options, self = this;

		self._validator(id);
		self._setErrors(false);
	},

	// called when forms are validated | write errorsArray to DOM | Take care of ARIA
	_setErrors: function(submitted){
		var options = this.options, 
			self = this,
			hasError = false,
			addError = false,
			removeError = false,
			msgs = "", 
			msg = "";

		// got trough every error form element
		for (var id in options.forms){
			// needed to ensure error Class isn't removed if required error still exists
			var failure = false;
			for (var rule in options.forms[id]["errors"]){
				// set error as corrected
				if (options.forms[id]["errors"][rule] == "corrected" || options.forms[id].disabled) {
					var target = options.forms[id].element;
					// ARIA
					target.attr("aria-invalid", false);
					// check for radio group or checkbox group
					if (options.forms[id].type == "group") target = target.next();
					// unhighlight error field
					target.removeClass("ui-state-error");
					// ARIA: old error deleted
					removeError = true;
					// execute callback for every (really) corrected element ; returns the id of the element
					if (!options.forms[id].disabled) self._trigger("onValid", null, id);
				} else {
					if (options.forms[id]["errors"][rule] == "new" || options.forms[id]["errors"][rule] == "old") {
						if (options.errorSummery) msgs += '					<li><a href="#'+id+'">'+options.forms[id].msg[rule]+"</a></li>\n";
						// there are errors to show
						hasError = failure = true;
						// execute callback for every element with wrong input; returns the ids of the elements
						self._trigger("onError", null, id);
					}
					if (options.forms[id]["errors"][rule] == "new") {
						// ARIA: new error added
						addError = true;
					}
				}
			}
			// check at last if there is an error so error class wont be removed
			if (failure) {
				var target = options.forms[id].element;
				target.attr("aria-invalid", true);
				// check for radio group or checkbox group
				if (options.forms[id].type == "group") target = target.next();
				// highlight error field
				target.addClass("ui-state-error");
			}
		}

		// show error summery if enabled or only when form is submitted
		if (options.errorSummery === true || (options.errorSummery == "onSubmit" && submitted)) self._showErrors({submitted: submitted, hasError: hasError, addError: addError, removeError: removeError, msgs: msgs});

		// no click events if no error is defined
		if (hasError) {
			// Callback fired when error exists
			self._trigger("onErrors", 0);
		// send data if no errors found
		} else if(submitted) {
			self._sendForm();
		}

		self._updateVirtualBuffer();
	},

	// called when forms are validated | write errorsArray to DOM | Take care of ARIA
	_showErrors: function(data){
		var options = this.options;
		// take care of ARIA
		var aria = ' aria-live="assertive"';
		if (data["addError"] || data["removeError"]) aria += ' aria-relevant="text';
		if (data["addError"]) aria += ' additions';
		if (data["removeError"]) aria += ' removals';
		if (data["addError"] || data["removeError"]) aria += '"';

		// build up HTML | no content if no error is found
		if (data["hasError"]) {
			var html = "\n";
			html += '			<div'+aria+' class="ui-state-highlight ui-state ui-corner-all">'+"\n";
			html += '				<p id="ui-error-title-'+options.uid+'">'+"\n";
			html += '					<span class="ui-icon ui-icon-alert" style="float: left; margin-right: 0.3em;"></span>'+"\n";
			html += '					'+options.errorsTitle+"\n";
			html += '				</p>'+"\n";
			html += '				<ul aria-labelledby="ui-error-title-'+options.uid+'">'+"\n";
			html += data["msgs"];
			html += '				</ul>'+"\n";
			html += '			</div>'+"\n\t\t";
			// inject error HTML and make onclick event for direct error correction
			this.errorElement.html(html);
			// focus error box when form is submitted
			if (data["submitted"]) this.errorElement.attr("tabindex",-1).focus();
		} else {
			this.errorElement.empty();
		}

		// Callback
		this._trigger("onShowErrors", 0);
	},

	// send form
	_sendForm: function() {
		var options = this.options, self = this;

		switch (options.submitHowTo) {
			default:
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
				self.element.attr("action", options.submitUrl)	;
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
		var options = this.options,
			msg = "", 
			icon = "";
		// reenable the widget
		options.disabled = false;

		// fix for safari bug
		if (jQuery.browser.safari) this.element.find(".ui-formular-success").remove();

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
		var html = "\n";
		html += '		<div class="ui-formular-success">'+"\n";
		html += '			<div aria-live="assertive" class="ui-state-highlight ui-state ui-corner-all">'+"\n";
		html += '				<p>'+"\n";
		html += '					<span class="ui-icon ui-icon-'+icon+'" style="float: left; margin-right: 0.3em;"></span>'+"\n";
		html += '					'+msg+"\n";
		html += '				</p>'+"\n";
		html += '			</div>'+"\n\t\t";
		html += '		</div>'+"\n\t\t";
		this.element.prepend(html);
		this.element.find(".ui-formular-success").attr("tabindex",-1).focus();
		this._updateVirtualBuffer();
		// Callback
		this._trigger("onShowSuccess", null, value);
	},

	// decides if error is new, old or corrected
	_whichError: function(error, array) {
		var value = "";
		if (!error) {
			value = (array == "new" || array == "old") ? "old" : "new";
		} else if (array == "new" || array == "old" ) {
			value = "corrected";
		}
		return value;
	},

	// how many checked / selected options | which value
    _getValue: function(id) {
        var options = this.options,
            value = "";

        switch(options.forms[id].type) {
            case "single":
                    value = options.forms[id].element.val();
                break;
            case "group":
                    var result = options.forms[id].element.filter(':checked');
                    if (result.length) value = result;
                break;
            case "select":
                    var result = options.forms[id].element.children("option").filter(':selected');
                    // check if we could select multiple elements
                    if (options.forms[id].element.attr("multiple")) {
                        value = result;
                    } else {
                        // if not multiple items selected, there could be a default option
                        value =  (result.val() == options.selectDefault) ? 0 : result.val();
                    }
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
		if (options.originalUrl != "") this.element.attr("action", options.originalUrl);
		// remove injected elements
		this.element.find(".ui-formular-live, .ui-formular-error, .ui-formular-success").remove();
		$("body>form #virtualBufferForm").parent().remove();
		// call widget destroy function
		$.Widget.prototype.destroy.apply(this, arguments);
	},

	// updates virtual buffer | for older screenreader
	_updateVirtualBuffer: function() {
		var form = $("body>form #virtualBufferForm");
		if(form.length) {
			(form.val() == "1") ? form.val("0") : form.val("1");
		} else {
			var html = '<form><input id="virtualBufferForm" type="hidden" value="1" /></form>';
			$("body").append(html);
		}
	}
});
})(jQuery);