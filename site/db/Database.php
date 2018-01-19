<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 1/19/2018
 * Time: 2:43 PM
 */

namespace Site\DB;


class Database
{
    static $USERNAME = 'ffuser';
    static $PASSWORD = 'ffpass';
    static $NAME = 'ff-production';
    static $HOST = 'localhost';
    static $PORT = null;
    // Static
    
    private static $_dbInstance = null;

    public static function getInstance() {
        if(static::$_dbInstance)
            return static::$_dbInstance;

        // Try Server config file
        @include_once __DIR__ .'/../../config.php';

        $host     = static::$HOST;
        $dbname   = static::$NAME;
        $port     = static::$PORT;

        $PDO = new \PDO("mysql:host={$host};port={$port};dbname={$dbname}",
            static::$USERNAME,
            static::$PASSWORD,
            null);

        $PDO->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $PDO->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        static::$_dbInstance = $PDO;
        return $PDO;
    }
}