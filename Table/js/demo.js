function demoControl() {
	var widget = $("table");
	var headers = widget.ariaSorTable("option", "headers");
	var colsToHide = widget.ariaSorTable("option", "colsToHide");
		var html = 	'<div id="ui-table-control">';
		html +=		'	<fieldset class="ui-widget-content ui-corner-all">';
		html +=		'		<legend class="ui-widget-header ui-corner-all">Row Control</legend>';
		html +=		'		<form id="search">';
		html +=		'			<label class="ui-corner-all" for="search-field">Search</label>';
		html +=		'			<input type="text" id="search-field" class="text ui-widget-content ui-corner-all" />';
		html +=		'			<input type="submit" id="submit" value="Search" class="submit ui-state-default ui-corner-all" />';
		html +=		'		</form>';
		html +=		'	</fieldset>';
		html +=		'	<fieldset class="ui-widget-content ui-corner-all">';
		html +=		'		<legend class="ui-widget-header ui-corner-all">Cols Control</legend>';
		html +=		'		<form id="colSelect">';
	for (var x = 0; x < headers.length; x++){
		html +=		'			<div class="pair">';
		var selected = (!colsToHide[x]) ? ' checked="checked"' : '';
		html +=		'				<input'+selected+' type="checkbox" id="checkbox_'+x+'" class="radio" />';
		html +=		'				<label class="ui-widget-content ui-corner-all" for="checkbox_'+x+'">'+$(headers[x]).text()+'</label>';
		html +=		'			</div>';
	}
		html +=		'			<input type="submit" value="Show" class="submit ui-state-default ui-corner-all" />';
		html +=		'		</form>';
		html +=		'	</fieldset>';
		html +=		'</div>';
	$("#wrapper").append(html);
	var controlWrapper = $("#ui-table-control");

	// Cols Control
	var colSelect = controlWrapper.find("#colSelect");
	colSelect.find("input:checkbox")
	// change label class when hover the form element
		.bind("mouseenter", function(){ $(this).next().addClass('ui-state-hover'); })
		.bind("mouseleave", function(){ $(this).next().removeClass('ui-state-hover'); })
		.bind("focus", function(){ $(this).next().addClass('ui-state-focus'); })
		.bind("blur", function(){ $(this).next().removeClass('ui-state-focus'); })
	.next()
		.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
		.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
		.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
		.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });

	colSelect.find("input:submit")
		.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
		.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
		.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
		.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });

	colSelect.submit( function (event) {
		event.preventDefault();
		var checkboxes = colSelect.find("input:checkbox");
		for (var x = 0; x < checkboxes.length; x++) {
			var test = ($(checkboxes[x]).filter(':checked').length) ? false : true;
			colsToHide[x] = test;
		}
		widget.ariaSorTable('updateData');
		widget.ariaSorTable('setHTML', widget.ariaSorTable("option", "rowToStart"));
	});

	// Row Search
	var search = controlWrapper.find("#search")
	search.find("input:submit")
		.bind("mouseenter", function(){ $(this).addClass('ui-state-hover'); })
		.bind("mouseleave", function(){ $(this).removeClass('ui-state-hover'); })
		.bind("focus", function(){ $(this).addClass('ui-state-focus'); })
		.bind("blur", function(){ $(this).removeClass('ui-state-focus'); });

	search.find("#submit").click( function (event) {
		event.preventDefault();
		var query = search.find("input:text").val();
		var originalData = widget.ariaSorTable("option", "originalData");
		var colsToHide = widget.ariaSorTable("option", "colsToHide");
		var tableData = [];
		var xIndex = 0;
		for (var x = 0; x < originalData.length; x++) {
			var found = false;
			var temp = [];
			for (var y = 0; y < originalData[x].length; y++) {
				if (originalData[x][y].search(query) != -1) {
					found = true;
				}
				if (!colsToHide[y]) temp.push(originalData[x][y]);
			}
			if (found) {
				tableData[xIndex] = [];
				tableData[xIndex] = temp;
				xIndex++;
			}
		}
		widget.ariaSorTable("option", "tableData", tableData);
		widget.ariaSorTable("option", "rowsToShow", tableData.length);
		widget.ariaSorTable('setHTML', 1);
		$(".ui-table-pager").fadeOut();
		$("#ui-table-control #colSelect").parent().fadeOut();

	});
}