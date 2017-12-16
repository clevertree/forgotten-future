<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 9/11/2017
 * Time: 4:07 PM
 */

$params = @$_REQUEST['payload'] ?: file_get_contents('php://input');
if($params && $params[0] === '{') {
    $params = json_decode($params, true);
} else {
    $params = $_REQUEST;
}

header("Content-Type: text/plain");
echo "Executing Git Pull...\n";
echo exec("git pull");

echo "\nParameters: \n";
var_dump ($params);
