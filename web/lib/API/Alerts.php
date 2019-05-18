<?php

namespace API;

use mysql_xdevapi\Exception;

/**
 *  API/Alerts.php - API submodule library for alert-related logic
 */

class Alerts
{
    private $cache = null;
    public $dbConn = null;
    public $alertStore = [];
    public $alertDBQueryData = [
        'query' => '',
        'whereClause' => '',
        'vals' => []
    ];

    public function __construct($dbConn = null, $cache = null)
    {
        if(is_null($cache))
        {
            try
            {
                $this->cache = new \Cache();
            }
            catch(\Exception $e)
            {
                // caching isn't absolutely required, so we can let it fail if needed
                error_log('[ SEV: ERROR ] :: could not start cache for Alerts submodule :: [ MSG: '.$e->getMessage().' ]');
            }
        }
        else
        {
            $this->cache = $cache;
        }

        if(is_null($dbConn))
        {
            // no db handler provided; try creating one w/ default options
            try
            {
                $this->dbConn = new \DB();
            }
            catch(\Exception $e)
            {
                // a database connection may not be completely needed if we have access to the cache,
                // though functionality will be degraded
                if(is_null($this->cache))
                {
                    throw new \Exception('no data sources available (cache or data store)');
                }
            }
        }
        else
        {
            $this->dbConn = $dbConn;
        }

    }

    public function addSQLQueryConstraints($sqlColumnName, $constraintVal, $sqlComparisonOperator = '=',
                                           $allowZero = false)
    {
        /*
         *  Purpose: Append incoming constraint options for alert-related SQL queries to applicable obj vars
         *
         *  Params:
         *      * $sqlColumnName :: STR :: column name that the constraint is being placed on
         *      * $constraintVal :: ANY :: bound value used for constraint
         *      * $sqlComparisonOperator :: STR :: operator to use with constraint (e.g. =, >, in, etc)
         *      * $allowZero :: BOOL :: specifies whether 0 can be a possible value for the constraint value
         *
         *  Returns: NONE
         *
         *  Addl. Info: https://www.virendrachandak.com/techtalk/php-isset-vs-empty-vs-is_null/#axzz2ulvPcwYw
         *
         */

        // check constraint var validity
        if(!empty($constraintVal) || (!is_null($constraintVal) && (int)$constraintVal === 0 && $allowZero))
        {
            if($this->alertDBQueryData['whereClause'] != '')
            {
                // not initial constraint; append 'and' keyword before constraint clause
                $this->alertDBQueryData['whereClause'] .= ' AND ';
            }

            $this->alertDBQueryData['whereClause'] .= $sqlColumnName.' '.$sqlComparisonOperator.' ?';
            $this->alertDBQueryData['vals'][] = $constraintVal;
        }
    }

    public function getAlerts($alertID = 0, $alertType = null, $timeOptions = [ 'startTime' => null, 'endTime' => null ],
                              $nodeOptions = [ 'host' => null, 'src_node' => null, 'dst_node' => null ],
                              $queryOptions = [ 'orderBy' => 'alert_id', 'placement' => 'ASC', 'limit' => 5 ])
    {
        /*
         *  Purpose: fetch alerts from Inquisition db using given constraints
         *
         *  Params:
         *      * $alertId :: INT :: ID of alert to fetch :: NOTE: all other parameters are not considered when an
         *          alert ID is specified
         *      * $alertType :: INT :: type of alert to search for ::
         *          ALERT_TYPE: 1 = host anomaly, 2 = traffic node anomaly, 3 = threat
         *      * $timeOptions
         *          startTime :: DateTime :: earliest time to show alerts for
         *          endTime :: DateTime :: oldest time to show alerts for
         *      * $nodeOptions
         *          host :: STR :: host IP or hostname to filter alerts by
         *          src_node :: STR :: source IP or hostname to filter alerts by
         *          dst_node :: STR :: destination IP or hostname to filter alerts by
         *      * $queryOptions
         *          orderBy :: STR :: field name to order results by
         *          placement :: STR :: direction to order alerts in :: ASC or DESC
         *          limit :: INT :: maximum amount of alerts to display (0 = unlimited)
         *
         *  Returns: NONE
         *
         */

        // API response format framework: https://github.com/omniti-labs/jsend
        $alertDataset = [
            'status' => 'success',
            'data_source' => 'cache',
            'data' => []
        ];

         $this->alertDBQueryData['query'] =
            "
              /* Celestial // Alerts.php // Fetch alerts */
              SELECT 
               alert_id, created, updated, ATM.type_name as alert_type, host, src_node, dst_node, alert_detail, log_data 
              FROM Alerts 
              JOIN AlertTypeMapping ATM
              ON (Alerts.alert_type=ATM.type_id)
            ";

        // convert epoch timestamp to SQL timestamp if needed
        foreach($timeOptions as $key => $timestamp)
        {
            if((string)(int)$timestamp === $timestamp && PHP_INT_MIN <= $timestamp and $timestamp <= PHP_INT_MAX)
            {
                $dt = new \DateTime("@$timestamp");
                $timeOptions[$key] = $dt->format('Y-m-d H:i:s');
            }
        }

        // generate subquery for constraints
        $this->addSQLQueryConstraints('alert_id', $alertID);
        $this->addSQLQueryConstraints('alert_type', $alertType, '=', true);
        if(isset($timeOptions['startTime']))
        {
            $this->addSQLQueryConstraints('updated', $timeOptions['startTime'], '>=');
        }
        if(isset($timeOptions['endTime']))
        {
            $this->addSQLQueryConstraints('updated', $timeOptions['endTime'], '<=');
        }
        foreach($nodeOptions as $key => $node)
        {
            $this->addSQLQueryConstraints($key, $node);
        }

        // set db query where clause if applicable
        if(!empty($this->alertDBQueryData['whereClause']))
        {
            $this->alertDBQueryData['query'] .= ' WHERE '.$this->alertDBQueryData['whereClause'];
        }

        // append order by and limit clauses if needed
        if(!empty($queryOptions['orderBy']))
        {
            // check order by option is allowed since using identifiers with paramaterized sql is not possible
            // see: https://stackoverflow.com/a/2543144/2625915
            $normalizedOrderByField = strtolower($queryOptions['orderBy']);
            $availableOrderByFields = ['alert_id', 'created', 'updated', 'alert_type', 'host', 'src_node', 'dst_node',
                                        'alert_detail', 'log_data'];
            if(!in_array($normalizedOrderByField, $availableOrderByFields, true))
            {
                // not an acceptable order by field, use default
                $normalizedOrderByField = 'alert_id';
            }

            // check placement is valid
            $normalizedPlacement = strtoupper($queryOptions['placement']);
            if($normalizedPlacement != 'ASC' && $normalizedPlacement != 'DESC')
            {
                // overwrite with default val
                $normalizedPlacement = 'ASC';
            }

            $this->alertDBQueryData['query'] .= ' ORDER BY '.$normalizedOrderByField.' '.$normalizedPlacement;
        }
        if(!empty($queryOptions['limit']) && 0 < $queryOptions['limit'])
        {
            $this->alertDBQueryData['query'] .= ' LIMIT ?';
            $this->alertDBQueryData['vals'][] = $queryOptions['limit'];
        }

        // get results
        // check cache first
        $cacheResults = [];
        if(!is_null($this->cache))
        {
            $cacheKey = $this->cache->generateCacheKey($this->alertDBQueryData, 'alerts');
            $cacheResults = $this->cache->readFromCache($cacheKey);
        }

        if(!empty($cacheResults))
        {
            $alertDataset['data'] = $this->alertStore = $cacheResults;
        }
        else
        {
            // cache miss; try to fetch the results and write them to the cache for later
            if(!is_null($this->dbConn))
            {
                // set query and opts in dbConn obj
                $this->dbConn->dbQueryOptions['query'] = $this->alertDBQueryData['query'];
                $this->dbConn->dbQueryOptions['optionVals'] = $this->alertDBQueryData['vals'];

                $alertDataset['data_source'] = 'data_store';
                $alertDataset['data'] = $this->alertStore = $this->dbConn->runQuery();

                // write to cache if possible
                if(!is_null($this->cache))
                {
                    $this->cache->writeToCache($cacheKey, $this->alertStore);
                }
            }
            else
            {
                throw new \Exception('no database connection available');
            }
        }

        return $alertDataset;
    }

    public function deleteAlert($alertID)
    {
        /*
         *  Purpose: delete alert with given alert ID
         *
         *  Params:
         *      * $alertId :: INT :: ID of alert to delete
         *
         *  Returns: Associative Array
         *
         */

        if($alertID < 1)
        {
            throw new \Exception('invalid alert ID provided');
        }


        $alertDataset = [
            'status' => 'success',
            'data_source' => 'data_store',
            'data' => []
        ];

        // set base query
        $this->alertDBQueryData['query'] =
            "
              /* Celestial // Alerts.php // Delete alert */
              DELETE FROM 
                Alerts
            ";

        // generate subquery for constraints
        $this->addSQLQueryConstraints('alert_id', $alertID);
        if(!empty($this->alertDBQueryData['whereClause']))
        {
            $this->alertDBQueryData['query'] .= ' WHERE '.$this->alertDBQueryData['whereClause'];
        }

        // add a limit restriction for safe query best practices
        $this->alertDBQueryData['query'] .= ' LIMIT 1';

        // run DB query
        if(!is_null($this->dbConn))
        {
            // set query and opts in dbConn obj
            $this->dbConn->dbQueryOptions['query'] = $this->alertDBQueryData['query'];
            $this->dbConn->dbQueryOptions['optionVals'] = $this->alertDBQueryData['vals'];

            $alertDataset['data_source'] = 'data_store';

            $queryResult = $this->dbConn->runQuery('delete');
            if(!$queryResult)
            {
                throw new \Exception('failed to delete alert from DB');
            }
        }
        else
        {
            throw new \Exception('no database connection available');
        }

        return $alertDataset;
    }
}