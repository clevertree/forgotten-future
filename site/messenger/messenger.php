<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 9/11/2017
 * Time: 4:07 PM
 */

use Site\DB\Database;
use Site\DB\Table\UserTokenRow;

chdir('../../');
spl_autoload_register();

header("Content-Type: application/json");

$params = @$_REQUEST['payload'] ?: file_get_contents('php://input');
if($params && $params[0] === '{') {
    $params = json_decode($params, true);
} else {
    $params = $_POST;
}

//$params = array(
//    'action' => 'subscribe',
//    'token' => 'omg',
//);

$DB = new Database();

$json = array('error' => null);
try {
    switch($params['action']) {
        default:
            $json = array(
                'error' => 'No Action',
                'params' => $params
            );
            break;

        case 'subscribe':
            $token = htmlspecialchars($params['token']);
            $topic = htmlspecialchars(@$params['topic'] ?: 'default');

            $Token = UserTokenRow::fetchByToken($token, false);
            if($Token) {
                http_response_code(409);
                $json = array(
                    'message' => "Token was already found",
//                'user_id' => 1,
                );
            } else {
                $Token = UserTokenRow::createNewToken($token);
                $json = array(
                    'message' => "User token stored successfully",
//                'user_id' => 1,
                );
            }

            $API = new \Site\Messenger\API\MessengerAPI();
            $API->subscribeToTopic($Token, $topic);
            break;
    }
} catch (Exception $ex) {
    $json = array(
        'error' => $ex->getMessage(),
        'trace' => $ex->getTraceAsString(),
        'params' => $params
    );
}

echo json_encode($json, JSON_PRETTY_PRINT);
