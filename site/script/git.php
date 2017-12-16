<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 9/11/2017
 * Time: 4:07 PM
 */


$params = file_get_contents('php://input');
if($params && $params[0] === '{') {
    $params = json_decode($params, true);
} else {
    $params = $_REQUEST;
}

//$path = $params['path'];
//$data = $params['data'];

$root = dirname(dirname(dirname(dirname(__DIR__))));
$realpath = realpath($root . '/' . $path); //  . rand(1111, 9999) . '.save.png'


system("/usr/bin/git pull");
