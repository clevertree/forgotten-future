<?php namespace Listener;

require('PaypalIPN.php');

//chdir('../../../');
set_include_path(dirname(dirname(dirname(__DIR__))));
spl_autoload_register();

use PaypalIPN;
use Site\DB\Table\PaymentRow;
use Site\DB\Table\UserRow;

$ipn = new PaypalIPN();

// Use the sandbox endpoint during testing.
$ipn->useSandbox();

//error_log("PAYPAL RESPONSE " . print_r($_POST, true));
try {
    $verified = $ipn->verifyIPN();
    if (!$verified) {
        error_log("PAYPAL RESPONSE WAS NOT VERIFIED: " . print_r($_POST, true));
        header("HTTP/1.1 400 Not Verified");
        die();
    }

    /*
     * Process IPN
     * A list of variables is available here:
     * https://developer.paypal.com/webapps/developer/docs/classic/ipn/integration-guide/IPNandPDTVariables/
     */
    $PaymentRow = storeVerifiedEntry($_POST);
    // Reply with an empty 200 response to indicate to paypal the IPN was received correctly.
    header("HTTP/1.1 200 OK");
    header("Content-Type: text/plain");

} catch (\Exception $e) {
    header("HTTP/1.1 400 " . $e->getMessage());
    header("Content-Type: text/plain");
    echo $e;
    error_log("PAYPAL RESPONSE FAILED: " . $e . print_r($_POST, true));
}



function storeVerifiedEntry($post, UserRow $UserRow=null) {
    return PaymentRow::createNewPaymentEntry(
        $post['payment_status'],
        $post['payment_type'],
        $post['mc_gross'],
        $post['payer_email'],
        $post['first_name'] . ' ' . $post['last_name'],
        @$post['txn_id'],
        strtotime(strstr($post['payment_date'], '(', true)),
        $UserRow,
        $post
    );
}