<?php namespace Listener;

require('PaypalIPN.php');

use PaypalIPN;

$ipn = new PaypalIPN();

// Use the sandbox endpoint during testing.
$ipn->useSandbox();

error_log("PAYPAL RESPONSE " . print_r($_POST, true));
try {
    $verified = $ipn->verifyIPN();
    if ($verified) {
        /*
         * Process IPN
         * A list of variables is available here:
         * https://developer.paypal.com/webapps/developer/docs/classic/ipn/integration-guide/IPNandPDTVariables/
         */
    }
    // Reply with an empty 200 response to indicate to paypal the IPN was received correctly.
    header("HTTP/1.1 200 OK");
    header("Content-Type: text/plain");
    print_r($_POST);
} catch (\Exception $e) {
    header("HTTP/1.1 400 " . $e->getMessage());
    header("Content-Type: text/plain");
    echo $e;
    print_r($_POST);
}

