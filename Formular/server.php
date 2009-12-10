<?php
	// checking correkt data transfer
	if (!empty($_POST['inputtext']) || !empty($_POST['txtarea']) || !empty($_POST['checkboxset']) || !empty($_POST['confirm'])) {
		echo "true";
	} else {
		echo "Es ist ein technischer Fehler aufgetreten";
	}
	// print_r($_POST);
?>