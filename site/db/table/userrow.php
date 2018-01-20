<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 1/19/2018
 * Time: 3:03 PM
 */

namespace Site\DB\Table;

use Site\DB\Database;

class UserRow
{
    const _CLASS = __CLASS__;
    const TABLE = 'user';

    // Table ticket
    protected $id;
    protected $uid;
    protected $name;
    protected $full_name;
    protected $created;
    protected $extra;

    const SQL_SELECT = "
        SELECT
            u.*
        FROM user u
";
    const SQL_GROUP_BY = ""; // "\nGROUP BY s.id";
    const SQL_ORDER_BY = "\nORDER BY u.id DESC";

    public function getID()             { return $this->id; }
    public function getUID()            { return $this->uid; }
    public function getName()           { return $this->name; }
    public function getFullName()       { return $this->full_name; }
    public function getCreateDate()     { return $this->created; }
    public function getExtra() {
        if(!is_array($this->extra))
            $this->extra = json_decode($this->extra, false);
        return $this->extra;
    }

    public function updateFullName($first_name, $last_name=null) {
        if(!$last_name)
            list($first_name, $last_name) = explode(' ', $first_name, 2);

        $this->full_name = $last_name ? $first_name . ' ' . $last_name : $first_name;

        $values = array(
            ':full_name' => $this->full_name,
            ':id' => $this->id
        );

        $SQL = "UPDATE user SET 
            `full_name` = :full_name
        WHERE id = :id";

        $DB = Database::getInstance();
        $stmt = $DB->prepare($SQL);

        $ret = $stmt->execute($values);
        if(!$ret)
            throw new \PDOException("Failed to update row");

        return $stmt->rowCount();
    }

    public function updateExtra(Array $extra, $replace=false) {
        if(!$replace)
            $extra = $extra + $this->getExtra();

        $this->extra = json_encode($extra, JSON_PRETTY_PRINT);

        $values = array(
            ':extra' => $this->extra,
            ':id' => $this->id
        );

        $SQL = "UPDATE user SET 
            `extra` = :extra
        WHERE id = :id";

        $DB = Database::getInstance();
        $stmt = $DB->prepare($SQL);

        $ret = $stmt->execute($values);
        if(!$ret)
            throw new \PDOException("Failed to update row");

        return $stmt->rowCount();
    }


    // Static


    /**
     * Delete a row
     * @param UserRow $UserRow
     */
    public static function delete(UserRow $UserRow) {
        $SQL = "DELETE from user\nWHERE uid = :uid ";
        $DB = Database::getInstance();
        $stmt = $DB->prepare($SQL);
        $ret = $stmt->execute(array(
            ':uid' => $UserRow->getUID()
        ));

        if(!$ret)
            throw new \PDOException("Failed to delete row");
        if($stmt->rowCount() === 0)
            error_log("Failed to delete row: " . print_r($UserRow, true));
    }

    /**
     * @param $name
     * @param $full_name
     * @return UserRow
     * @throws \Exception
     */
    public static function createNewUser(
        $name,
        $full_name
    ){

        $values = array(
            ':uid' => self::generateReferenceNumber(),
            ':name' => $name,
            ':full_name' => $full_name,
        );

        $SQL = "INSERT INTO user SET 
            `uid` = :uid,
            `name` = :name,
            `full_name` = :full_name,
            `created` = UTC_TIMESTAMP()
            ";

        $DB = Database::getInstance();
        $stmt = $DB->prepare($SQL);
        $stmt->execute($values);

        $id = $DB->lastInsertId();
        $Row = static::fetchByID($id);
        return $Row;
    }

    // Query and Fetch

    public static function queryByField($field, $value) {
        $DB = Database::getInstance();
        $Query = $DB->prepare(static::SQL_SELECT . "WHERE u.{$field} = ?");
        /** @noinspection PhpMethodParametersCountMismatchInspection */
        $Query->setFetchMode(\PDO::FETCH_CLASS, self::_CLASS);
        $Query->execute(array($value));
        return $Query;
    }

    /**
     * @param $field
     * @param $value
     * @param bool $throwException
     * @return UserRow
     */
    public static function fetchByField($field, $value, $throwException=true) {
        $Row = static::queryByField($field, $value)
            ->fetch();
        if(!$Row && $throwException)
            throw new \InvalidArgumentException("{$field} not found: " . $value);
        return $Row;
    }


    /**
     * @param string $uid
     * @param bool $throwException
     * @return UserRow
     * @throws \Exception
     */
    public static function fetchByUID($uid, $throwException=true) {
        return static::fetchByField('uid', $uid, $throwException);
    }

    /**
     * @param string $id
     * @param bool $throwException
     * @return UserRow
     */
    public static function fetchByID($id, $throwException=true) {
        return static::fetchByField('id', $id, $throwException);
    }

    // Generate UID

    /**
     * Generate a UID
     * @return string
     */
    public static function generateReferenceNumber() {
        return 'U-' . sprintf('%04X%04X-%04X%04X', mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535));
    }
}