<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 9/11/2017
 * Time: 4:07 PM
 */

header("Content-Type: text/plain");
echo "Executing Git Pull...\n";
echo exec("git pull");
