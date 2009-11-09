/*
 * jQuery UI ariaSorTable (09.11.09)
 *
 * Copyright (c) 2009 Felix Nagel for Namics (Deustchland) GmbH
 * Licensed under Creative Commens Attribution-Share Alike 3.0 Unported (http://creativecommons.org/licenses/by-sa/3.0/)
 * 
 *  Depends: ui.core.js

 USAGE:::::::::::::
* Take a look in the html file or the (german) pdf file delivered with this example
* To set sorting method add css classes, default is text, alphabetically 

* Sorting CSS classes (apply to th elements)
ui-table-number 		123 or 123.456
ui-table-number-de 		123,456
ui-table-date 			07/28/2009
ui-table-date-de		28.07.2009
ui-table-date-iso		2009-07-28  
 ui-table-deactivate 	deactivates sorting for this col
 ui-state-active 		class to set a col as pre sorted (server site)

 * Options	
rowToStart			row to start, begins with 1
rowsToShow			How many rows to show? If not set, widget will show all rows
colScopeRow			Which col has scope? Could be the UID or a names, begins with 1
defaultSortBy		first sorting action sould sort ascending or descending?
colsToHide			array; set value true if col should be hided, example: colsToHide[3] = true;
rowsToHide			array; set value true if row should be hided, example: rowsToHide[3] = true;
keyboard			activate default keyboard control
pager				add default pager control; (do use with rowsToShow < all rows in the original table)
textPager			String pager
textAsc				String for sorting ascending
textDesc			String for sorting descending
disabled			deactivate the widget
			
* Callbacks
onInit
onUpdateData
onSetHTML
onRowSort

* public Methods
updateData
setHTML
rowSort
colSwitch
buildPager
setPager
disable
enable
disable
destroy
 
 */
(function($) {
// necassary global var for STRING.sort() function clauses
var sortIndex = 0;
$.widget("ui.ariaSorTable", {

	_init: function() {	
		var options = this.options, self = this;	
		// init vars		
		options.tableData = [];
		options.originalData = [];
		options.selectedCol = 0;
		options.activeCol = 0;		
		
		// ARIA | make UID if no ID is set by default
		var elementID = self.element.attr("id");
		if (elementID != "") {
			options.uid = elementID;
		} else {
			options.uid = new Date().getTime();
			self.element.attr("id", "ui-table-"+options.uid)
		}		
		self.element.find("caption").attr("id", "ui-table-"+options.uid+"-caption");
		self.element
		.attr("role","grid")
		.attr("aria-readonly","true")
		.attr("aria-labelledby", "ui-table-"+options.uid+"-caption");
			
		// bubbling event for th link elements
		var theadTr = self.element.find("thead tr")
		.bind("click", function(e){
			if (!options.disabled) {
				var el = th = $(e.target);
				// get the th element
				while (!th.is("th")) {
					th = th.parents("th");
				}			
				if (!th.hasClass("ui-table-deactivate")) {	
					e.preventDefault();	
					// start sorting | parameter: index of the clicked th element
					self.rowSort(th.prevAll("th:visible").length);	
				}
			}
		})
		.attr("role", "row");
		
		// save header elements (th)
		options.headers = theadTr.find("th");
		options.headers.each( function(index) {
			// get single th element
			var th = $(options.headers[index]);
			
			// ARIA 
			th.attr("id","ui-table-" + options.uid + "-header-" + index)
			.attr("role","columnheader")
			.attr("scope","col");
			
			// select title text ( next sorting action)
			var text = (options.defaultSortBy == "asc") ? options.textAsc : options.textDesc;			
			var thA = th.find("a").length;
			if (!th.hasClass("ui-table-deactivate")) {	
				// no link but JS sort function? Add link
				if (!thA) {
					th.html('<a title="'+text+'" href="#ui-table-dummy">'+th.html()+'</a>');
				}
				// set title attribute | add events
				th.children("a")
				.attr("title", text)
				.bind("mouseenter", function(){ $(this).parent().addClass('ui-state-hover'); })
				.bind("mouseleave", function(){ $(this).parent().removeClass('ui-state-hover'); });
			//not activated th elements with no link are added to the tabindex by setting tabindex attribute
			} else if (!thA) {
				th.attr("tabindex", 0);
			}	
			
			// save pre sorted (server site) ; aka active col | set attributes
			if (th.hasClass("ui-state-active")) {
				if (th.hasClass("ui-table-asc")) {
					th.attr("aria-sort", "ascending").children("a").attr("title", options.textDesc);
				} else if (th.hasClass("ui-table-desc")) {
					th.attr("aria-sort", "descending").children("a").attr("title", options.textAsc);
				}
				options.activeCol = index;				
			}
		});		
		
		// get all table data and save them
		var rows = self.element.find("tbody tr");	
		// go trough every row	
		for (var x = 0; x < rows.length; x++) {
			options.originalData[x] = [];
			var cells = $(rows[x]).children("td");
			for (var y = 0; y < cells.length; y++) {
				options.originalData[x][y] = $(cells[y]).html();
			}
		}
		// set var to table length if no custom value
		if (!options.rowsToShow) options.rowsToShow = rows.length;
		// update data to delete hided rows and cols
		self.updateData(); 
		// set new HTML (with ARIA)
		self.setHTML();		
		// pager?
		if (options.pager) self.buildPager();			
		// activate Keyboard accessibility
		if (options.keyboard) self._setKeyboard();
		// Callback
		self._trigger("onInit", 0);
	},
	
	// make another "cleaned" version of the data array | delete hidden rows and cols
	updateData: function () {
		var options = this.options, self = this;
		options.tableData = [];
		var xIndex = 0;
		for (var x = 0; x < options.originalData.length; x++) {
			if (!options.rowsToHide[x]) {
				options.tableData[xIndex] = [];
				for (var y = 0; y < options.headers.length; y++) {
					if (!options.colsToHide[y]) options.tableData[xIndex].push(options.originalData[x][y]);
				}
				xIndex++;
			} 
		}
		// Callback
		self._trigger("onUpdateData", 0);
	},	
	
	// set new HTML with selected data
	setHTML: function() {
		var options = this.options, self = this;				
		// var for diffrent row colors
		var second = true;
		var html = [];
		html.push(					"<tbody class=\"ui-table-tbody-active\" aria-live=\"polite\" aria-relevant=\"text\">\n");
		for (var x = options.rowToStart - 1; x < options.rowToStart - 1 + options.rowsToShow; x++) {
			// check if row data exists
			if (options.tableData[x]) {
				// diffrent row css class
				var rowClass = (second) ? "class=\"odd\"" : "";		
				second = (second) ? false : true;		
				html.push(		"\t\t\t\t<tr role=\"row\""+rowClass+">\n");
				// build table html (with ARIA and HTML table relation attributes)
				for (var y = 0; y < options.tableData[x].length; y++) {
					if (y+1 == options.colScopeRow) {
						html.push("\t\t\t\t\t<td headers=\"ui-table-"+ options.uid +"-header-"+ y +"\" scope=\"row\" role=\"rowheader\">" + options.tableData[x][y] + "</td>\n");
					} else {
						html.push("\t\t\t\t\t<td headers=\"ui-table-"+ options.uid +"-header-"+ y +"\" role=\"gridcell\">" + options.tableData[x][y] + "</td>\n");
					}
				}
				html.push(			"\t\t\t\t</tr>\n");
			}
		}
		html.push(					"\t\t\t</tbody>");
		var str = '';
		str = html.join('');
		// replace tbody or hide original and add new | dont remove but hide because of performance
		var tbody = self.element.find("tbody.ui-table-tbody-active");
		if (tbody.length) {
			tbody.replaceWith(str);
		} else {
			self.element.find("tbody").hide();
			self.element.append(str);
		}
		
		// show or hide header cols
		if (options.colsToHide)
		options.headers.each( function(index) {
			if (!options.colsToHide[index]) {
				$(this).show();
			} else {
				$(this).hide();
			}
		});		
		
		// ARIA
		$(options.headers[0]).parent().parent()
		.attr("aria-live", "polite")
		.attr("aria-relevant","text");
		// update virtual Buffer
		self._updateVirtualBuffer();
		// Callback
		self._trigger("onSetHTML", 0);
	},
	
	// sort data, build and add the new html to the DOM
	rowSort: function (index) {
		var options = this.options, self = this;
		// get all visible th elements
		var thArray = options.headers.filter(":visible");
		// get new (clicked) th element
		th = $(thArray[index]);	
			
		// set global index		
		sortIndex = index;
		// check the css class and sort the array
		if (th.hasClass("ui-table-number")) {
			options.tableData.sort(self._sortNumber);
		} else if (th.hasClass("ui-table-number-de")) {
			options.tableData.sort(self._sortNumberDE);
		} else if (th.hasClass("ui-table-date")) {
			options.tableData.sort(self._sortDate);
		} else if (th.hasClass("ui-table-date-de")) {
			options.tableData.sort(self._sortDateDE);
		} else if (th.hasClass("ui-table-date-iso")) {
			options.tableData.sort(self._sortDateISO);
		} else {
			options.tableData.sort(self._sortText);
		}
		
		// set new sorted by
		var asc = th.hasClass("ui-table-asc");
		if (asc || th.hasClass("ui-table-desc")) {		
			var newSortBy = (asc) ? "desc" : "asc";	
		// no class found? set it by default
		} else {
			var newSortBy = options.defaultSortBy;
		}		
		
		// rerse array if necassary
		if (newSortBy == "desc") options.tableData.reverse();
			
		// get active col
		var thActiveCol = $(thArray[options.activeCol]);
		// set class to remove of the active col
		var sortedBy = (thActiveCol.hasClass("ui-table-asc")) ? "asc" : "desc";
		// delete css class of the last sorted col
		thActiveCol
		.removeClass("ui-table-" + sortedBy)
		.removeClass("ui-state-active")
		// set ARIA-sort to none
		.attr("aria-sort", "none");
		
		// remove focus classs from selected col		
		$(thArray[options.selectedCol]).removeClass("ui-state-focus");	
			
		// set new title text
		var newSortByText = (newSortBy == "asc") ? options.textDesc : options.textAsc;
		var newSortByARIA = (newSortBy == "asc") ? "ascending" : "descending";
		// add new css class, title and css state to the new active col
		th.addClass("ui-state-active")
		.addClass("ui-table-" + newSortBy)
		.attr("aria-sort", newSortByARIA)
		.children("a").attr("title", newSortByText);
		
		// save new sorted and active col
		options.activeCol = options.selectedCol = index;	
		
		// Callback
		self._trigger("onRowSort", 0);				
		// update HTML 
		self.setHTML();	
	},
	// sorting clauses function
	_sortNumber: function (a, b) {
		// 123.456
		return (a[sortIndex] - b[sortIndex]);
	},
	_sortNumberDE: function (a, b) {
		// 123,456
		return (a[sortIndex].replace(",", ".") - b[sortIndex].replace(",", "."));
	},
	_sortDateDE: function (a, b) {	
		// 28.07.2009
		var aDate = a[sortIndex].substr(3,2) + "/" + a[sortIndex].substr(0,2) + "/" + a[sortIndex].substr(6,4);
		var bDate = b[sortIndex].substr(3,2) + "/" + b[sortIndex].substr(0,2) + "/" + b[sortIndex].substr(6,4);	
		return (Date.parse(aDate) < Date.parse(bDate));
	},
	_sortDate: function (a, b) {	
		// 07/28/2009
		return (Date.parse(a[sortIndex]) < Date.parse(b[sortIndex]));
	},
	_sortDateISO: function (a, b) {
		// 2009-07-28
		var aDate = a[sortIndex].substr(5,2) + "/" + a[sortIndex].substr(8,2) + "/" + a[sortIndex].substr(0,4);
		var bDate = b[sortIndex].substr(5,2) + "/" + b[sortIndex].substr(8,2) + "/" + b[sortIndex].substr(0,4);	
		return (Date.parse(aDate) < Date.parse(bDate));
	},
	_sortText: function (a, b) {
		// 20:00:13
		// Text, no html
		return (a[sortIndex] > b[sortIndex]);
	},
	
	// set keyboard control
	_setKeyboard: function () {	
		var options = this.options, self = this;	
		// listen and save the shift key event
		options.shift = false;			
		$(document)
		.keyup( function(e){ 
			if (e.keyCode == $.ui.keyCode.SHIFT && !options.disabled) {
				options.shift = false;
				return true;
			}
		})
		.keydown( function(e){ 
			if (e.keyCode == $.ui.keyCode.SHIFT && !options.disabled) {
				options.shift = true;
				return true;
			}
		});						
		self.element
		.keydown( function(e){ 
			if (!options.disabled) {
				switch (e.keyCode) {
					// go to next page
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.PAGE_DOWN:
						// check if new value is in range and if there are any pages to show
						if (options.rowToStart < options.tableData.length-1 && options.rowsToShow != options.tableData.length) { 
							if (options.pager) self.setPager(options.rowToStart + options.rowsToShow);
							options.rowToStart += options.rowsToShow;
							self.setHTML(); 
						}
						break;
					// go to previous page
					case $.ui.keyCode.UP:
					case $.ui.keyCode.PAGE_UP:
						// check if new value is in range and if there are any pages to show
						if (options.rowToStart > 0 + options.rowsToShow && options.rowsToShow != options.tableData.length) {
							if (options.pager) self.setPager(options.rowToStart - options.rowsToShow);
							options.rowToStart -= options.rowsToShow;	
							self.setHTML(); 
						}
						break;
					// go to first page
					case $.ui.keyCode.HOME:
						// check if there are any pages to show
						if (options.rowsToShow != options.tableData.length) {
							options.rowToStart = 1;
							self.setHTML();
						}
						break;
					// go to last page
					case $.ui.keyCode.END:
						// check if there are any pages to show
						if (options.rowsToShow != options.tableData.length) {
							options.rowToStart = ((Math.ceil(options.tableData.length / options.rowsToShow)) * options.rowsToShow) - options.rowsToShow + 1;
							self.setHTML();
						}
						break;
					// go to next or previous page
					case $.ui.keyCode.TAB:
						if (options.shift) { 
							if (options.selectedCol > 0) { self.colSwitch(-1) } else { return true; }
						} else { 
							if (options.selectedCol < options.headers.filter(":visible").length-1) { self.colSwitch(1); } else { return true; }
						}			
						break;
					// switch to left col
					case $.ui.keyCode.LEFT:
						if (options.selectedCol > 0) self.colSwitch(-1);	
						break;	
					// switch to right col
					case $.ui.keyCode.RIGHT:
						if (options.selectedCol < options.headers.filter(":visible").length-1) self.colSwitch(1);
						break;	
					// start sorting
					case $.ui.keyCode.SPACE:
						var th = options.headers.filter(":visible");
						$(th[options.selectedCol]).find("a").click();
						break;
					default:
						return true;
						break;
				}
				return false;	
			}
		})
	},
	// switchh selected col
	colSwitch: function (dir) {
		var options = this.options, self = this;
		// get visible headers
		var thArray = options.headers.filter(":visible");
		// remove old selected col css class
		$(thArray[options.selectedCol]).removeClass("ui-state-focus");
		// set new selected col
		options.selectedCol = options.selectedCol + dir;
		// get new selected col
		el = $(thArray[options.selectedCol]);
		// set new focus
		el.addClass("ui-state-focus");
		// set focus 
		if (el.find("a").length) { el.find("a").focus(); } else { el.focus(); }
	},
	// removes instance and attributes
	destroy: function() {
		this.element
		.unbind(".ariaSorTable")
		// remove data
		.removeData('ariaSorTable')
		// remove attributes
		.removeAttr("role")
		.removeAttr("aria-readonly")
		.removeAttr("aria-labelledby")		
			// remove attributes of the caption
			.find("caption").removeAttr("id")			
		// remove ARIA attributes from head element
		.end().find("thead")		
		.removeAttr("aria-live")
		.removeAttr("aria-relevant")		
			// remove event and role of the tr and show them all
			.find("tr")
			.removeAttr("role")
			.unbind("click")
			.end().end()			
		// remove injected HTML
		.find("tbody.ui-table-tbody-active").remove().end()		
		// show hidden original html
		.find("tbody").show();				
		// th's
		$.each(this.options.headers, function() {
			$(this)
			.show()
			.removeAttr("id")
			.removeAttr("role")
			.removeAttr("aria-sort")
			.removeAttr("tabindex")
			.removeAttr("scope");
			// search for added links and delete them | remove event
			var link = $(this).children("a");
			if (link.length) {
				link.unbind("mouseenter mouseleave").removeAttr("title");
				if (link.attr("href") == "#ui-table-dummy")	$(this).html(link.html());
			}
		});		
		// pager
		if (this.options.pager) $("#ui-table-pager").remove();
		// remove virtual buffer form
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

$.extend($.ui.ariaSorTable, {
	version: "1.7.1",
	defaults: {
		rowToStart: 1,
		rowsToShow: false,
		colScopeRow: 1,
		defaultSortBy: "asc",
		colsToHide: false,
		rowsToHide: false,
		keyboard: true,
		pager: false,
		textPager: "Page:",
		textAsc: "Sort ascending",
		textDesc: "Sort descending"
	}
});
$.fn.extend($.ui.ariaSorTable.prototype,{
	// build a pager
	buildPager: function () {		
		var options = this.options, self = this;
		// build html to inject
		var site = 0;
		var y = 0;
		var html = 	'<div class="ui-table-pager" aria-controls="ui-table-'+options.uid+'">'+"\n";
			html += 	'<span id="ui-table-'+options.uid+'-pager-title" class="ui-corner-all">'+options.textPager+'</span>'+"\n";						
		while (y < options.tableData.length){
			html += '	<button title="'+options.textPager+' '+ (site + 1) +'" type="button" class="ui-state-default ui-corner-all" aria-selected="false" aria-labelledby="ui-table-'+options.uid+'-pager-title">'+ (site + 1) +'</button>'+"\n";
			site++;
			y = y + options.rowsToShow;
		}
			html += '</div>'+"\n";			
		self.element.after(html);
		// ARIA
		options.pager = self.element.next(".ui-table-pager")
		.attr("aria-valuemin", 1)
		.attr("aria-valuemax", site);
		
		// set events | change css classes and sort table
		options.pagerButtons = options.pager.find("button")
		.each( function(index) {
			$(this)
			.bind("click", function(){ 
				// calculate new start position
				var newRowToStart = (options.rowsToShow * index == 0) ? 1 : (options.rowsToShow * index)+1;
				// set pager
				self.setPager(newRowToStart);
				// set new start point
				options.rowToStart = newRowToStart;
				// set new html
				self.setHTML();
			})
			.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
			.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
			.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
			.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });
		});	
		// set active button after set events
		self.setPager(options.rowToStart);
	},	
	
	// sets active page | call befor setting new options.rowToStart with new row as parameter
	setPager: function (newRow) {		
		var options = this.options, self = this;
		// calculate new start point and add or remove css classes and ARIA attributes
		$(options.pagerButtons[Math.floor(options.rowToStart/options.rowsToShow)]).removeClass('ui-state-active').attr("aria-selected", false);				
		$(options.pagerButtons[Math.floor(newRow/options.rowsToShow)]).addClass('ui-state-active').attr("aria-selected", true);
		options.pager.attr("aria-valuenow", Math.floor(newRow/options.rowsToShow)+1);
	}		
});

})(jQuery);
