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

$response = array(
);

try {
    switch(@$params['action']) {
        case 'asset-save-png':
            $response += assetSavePNG($params);
            break;
        default:
            $response += array('error' => "Invalid Action");
    }
} catch (Exception $ex) {
    $response['error'] = (String)$ex;
    $response['action'] = @$_GET['action'];
}

echo json_encode($response, JSON_PRETTY_PRINT);
die();


function assetSavePNG($params) {
    $path = $params['path'];
    $data = $params['data'];
//    $left = $params['left'];
//    $top = $params['top'];
//    $width = $params['width'];
//    $height = $params['height'];


    $root = dirname(dirname(dirname(dirname(__DIR__))));
    $realpath = realpath($root . '/' . $path); //  . rand(1111, 9999) . '.save.png'

    $data =  substr($data,strpos($data,",") + 1);
    if(!file_put_contents($realpath, base64_decode($data)))
        throw new Error("Could not write map file. " . $php_errormsg);

//
//    $gd = imageCreateFromPng($realpath);
//    imageAlphaBlending($gd, true);
//    imageSaveAlpha($gd, true);
//
////    $gd = imagecreatetruecolor($width, $height);
////    imagesavealpha($gd, true);
//
////    $trans_colour = imagecolorallocatealpha($gd, 0, 127, 0, 127);
////    imagefill($gd, 50, 50, $trans_colour);
////
//    $i=0;
//    for ($y=0; $y<$height; $y++) {
//        for($x=0; $x<$width; $x++) {
////            $alpha = ((int)(substr($data[$i + 3]  - 255, 1))) >> 1;
////            $pixel = imagecolorallocate($gd, $data[$i + 0], $data[$i + 1], $data[$i + 2]);
//            $pixel = imagecolorallocatealpha($gd, $data[$i + 0], $data[$i + 1], $data[$i + 2], intval($data[$i + 3]/2));
//            if(!imagesetpixel($gd, $x+$left, $y+$top, $pixel))
//                throw new Exception("Could not set pixel: " . $php_errormsg);
//            $i+=4;
//            if(sizeof($data) <= $i)
//                $i = 0;
//        }
//    }
//
//    @unlink($realpath . '.old.png');
//    @rename($realpath, $realpath . '.old.png');
//    if(!imagepng($gd, $realpath, 9, PNG_NO_FILTER))
//        throw new Error("Could not write map file. " . $php_errormsg);

    return array('success' => true, 'path' => $path, 'filesize' => filesize($realpath));
}