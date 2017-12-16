<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 9/11/2017
 * Time: 4:07 PM
 */

header("Content-Type: text/plain");

$params = @$_REQUEST['payload'] ?: file_get_contents('php://input');
if($params && $params[0] === '{') {
    $params = json_decode($params, true);
} else {
    $params = $_REQUEST;
}

echo "Executing Git Pull...\n";
echo exec("git pull");

echo "\nParameters: \n";
print_r ($params);
