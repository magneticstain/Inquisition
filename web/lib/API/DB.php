<?php
namespace API;

/**
 *  API/DB.php - class for database connections, queries, etc
 */

class DB
{
    public $dbConn = null;
    public $dbConfig = [
        'host' => '',
        'port' => 0,
        'username' => '',
        'password' => '',
        'dbName' => ''
    ];

    public function __construct($host = '127.0.0.1', $port = 3306, $dbName = 'inquisition',
                                $username = 'inquisition', $password = '')
    {
        $this->dbConfig['host'] = $host;
        $this->dbConfig['port'] = $port;
        $this->dbConfig['dbName'] = $dbName;
        $this->dbConfig['username'] = $username;
        $this->dbConfig['password'] = $password;

        # try connecting to db
        $this->connectToDb();
    }

    public function connectToDb()
    {
        /*
         *  Purpose: create db connection using stored info
         *
         *  Params: NONE
         *
         *  Returns: NONE
         *
         *  Addl. Info: uses PDO library
         *
         */

        $opts = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_EMULATE_PREPARES => false
        ];

        // create DSN
        $dsn = 'mysql:host='.$this->dbConfig['host'].';dbname='.$this->dbConfig['dbName'].';port='.$this->dbConfig['port'].';charset=utf8';

        // try connecting
        $this->dbConn = new \PDO($dsn, $this->dbConfig['username'], $this->dbConfig['password'], $opts);
    }
}