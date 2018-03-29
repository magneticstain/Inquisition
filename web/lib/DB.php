<?php

/**
 *  DB.php - class for database connections, queries, etc
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
    public $dbQueryOptions = [
        'query' => '',
        'optionVals' => []
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
        $dsn = 'mysql:host='.$this->dbConfig['host'].';dbname='.$this->dbConfig['dbName'].';port='
            .$this->dbConfig['port'].';charset=utf8';

        // try connecting
        $this->dbConn = new \PDO($dsn, $this->dbConfig['username'], $this->dbConfig['password'], $opts);
    }

    public function getColumnNamesOfTable($tblName)
    {
        /*
         *  Purpose: get list of column names for given table
         *
         *  Params:
         *      * $tblName :: STR :: name of table to list column names for
         *
         *  Returns: ARRAY
         *
         *  Addl. Info: ** DO NOT use this with untrusted data as the table name as this value is not escaped before
         *      running the query **
         *
         */

        $dbStmt = $this->dbConn->prepare("DESCRIBE ".$tblName);
        $dbStmt->execute();
        $fieldList = $dbStmt->fetchAll(PDO::FETCH_COLUMN);

        return $fieldList;
    }

    public function runQuery($queryType = 'select')
    {
        /*
         *  Purpose: run query with option values using db conn
         *
         *  Params:
         *      * $queryType :: STR :: type of query being ran (changes how results are returned)
         *
         *  Returns: ARRAY or BOOL
         *
         */

        $dbStmt = $this->dbConn->prepare($this->dbQueryOptions['query']);
        if($dbStmt->execute($this->dbQueryOptions['optionVals']) === true)
        {
            if(strtolower($queryType) === 'select')
            {
                return $dbStmt->fetchAll(\PDO::FETCH_ASSOC);
            }
            elseif($queryType === 'insert')
            {
                return [ 'id' => $this->dbConn->lastInsertId() ];
            }
            else
            {
                return true;
            }
        }
        else
        {
            return false;
        }
    }
}