<?php
	// checking correct data transfer
	if ($_POST != "") {
		echo "true";
	} else {	
		echo "There is a technical problem while receiving your data!";
	}
	// print_r($_POST);
?>