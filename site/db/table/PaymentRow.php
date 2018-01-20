<?php
/**
 * Created by PhpStorm.
 * User: ari
 * Date: 1/19/2018
 * Time: 3:03 PM
 */

namespace Site\DB\Table;

use Site\DB\Database;

class PaymentRow
{
    const _CLASS = __CLASS__;
    const TABLE = 'payment';

    // Table ticket
    protected $id;
    protected $uid;
    protected $status;
    protected $type;
    protected $amount;
    protected $email;
    protected $date;
    protected $full_name;
    protected $user_id;
    protected $extra;

    const SQL_SELECT = "
        SELECT
            p.*
        FROM payment p
        LEFT JOIN user u on u.id = p.user_id
";
    const SQL_GROUP_BY = ""; // "\nGROUP BY s.id";
    const SQL_ORDER_BY = "\nORDER BY p.id DESC";

    public function getID()             { return $this->id; }
    public function getUserID()         { return $this->user_id; }
    public function getCreateDate()     { return $this->date; }
    public function getExtra() {
        if(!is_array($this->extra))
            $this->extra = json_decode($this->extra, false);
        return $this->extra;
    }

    public function updateExtra(Array $extra, $replace=false) {
        if(!$replace)
            $extra = $extra + $this->getExtra();

        $this->extra = json_encode($extra, JSON_PRETTY_PRINT);

        $values = array(
            ':extra' => $this->extra,
            ':id' => $this->id
        );

        $SQL = "UPDATE payment SET 
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
     * @param PaymentRow $PaymentRow
     */
    public static function delete(PaymentRow $PaymentRow) {
        $SQL = "DELETE from payment WHERE id = :id";
        $DB = Database::getInstance();
        $stmt = $DB->prepare($SQL);
        $ret = $stmt->execute(array(
            ':id' => $PaymentRow->getID()
        ));

        if(!$ret)
            throw new \PDOException("Failed to delete row");
        if($stmt->rowCount() === 0)
            error_log("Failed to delete row: " . print_r($PaymentRow, true));
    }

    /**
     * @param $status
     * @param $type
     * @param $amount
     * @param $email
     * @param $full_name
     * @param $timestamp
     * @param null $uid
     * @param UserRow $UserRow
     * @param array|null $extra
     * @return PaymentRow
     */
    public static function createNewPaymentEntry(
        $status,
        $type,
        $amount,
        $email,
        $full_name,
        $timestamp,
        $uid = null,
        UserRow $UserRow=null,
        Array $extra = NULL
    ){

        $values = array(
            ':uid' => $uid ?: self::generateReferenceNumber(),
            ':status' => $status,
            ':type' => $type,
            ':amount' => $amount,
            ':email' => $email,
            ':full_name' => $full_name,
            ':date' => $timestamp ?: time(),
            ':user_id' => $UserRow ? $UserRow->getID() : NULL,
            ':extra' => $extra ? json_encode($extra, JSON_PRETTY_PRINT) : NULL,
        );

        $SQL = "INSERT INTO payment SET 
            `uid` = :uid,
            `status` = :status,
            `type` = :type,
            `amount` = :amount,
            `email` = :email,
            `full_name` = :full_name,
            `user_id` = :user_id,
            `extra` = :extra,
            `date` = FROM_UNIXTIME(:date)
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
        $Query = $DB->prepare(static::SQL_SELECT . "WHERE p.{$field} = ?");
        /** @noinspection PhpMethodParametersCountMismatchInspection */
        $Query->setFetchMode(\PDO::FETCH_CLASS, self::_CLASS);
        $Query->execute(array($value));
        return $Query;
    }

    /**
     * @param $field
     * @param $value
     * @param bool $throwException
     * @return PaymentRow
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
     * @return PaymentRow
     * @throws \Exception
     */
    public static function fetchByUID($uid, $throwException=true) {
        return static::fetchByField('uid', $uid, $throwException);
    }

    /**
     * @param string $id
     * @param bool $throwException
     * @return PaymentRow
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
        return 'P-' . sprintf('%04X%04X-%04X%04X', mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535));
    }
}