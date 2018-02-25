<?php

namespace API;

/**
 *  API/Alerts.php - API submodule library for alert-related logic
 */

class Alerts
{
    public $dbConn = null;
    public $alertStore = [];
    public $alertDBQueryConstraintData = [
        'query' => '',
        'vals' => []
    ];

    public function __construct($dbConn = null)
    {
        if(is_null($dbConn))
        {
            // no db handler provided; try creating one w/ default options
            $this->dbConn = new \DB();
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
         *  Purpose: Append incoming constraint options for alert-related SQL queries
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
            if($this->alertDBQueryConstraintData['query'] != '')
            {
                // not initial constraint, append 'and' keyword before constraint clause
                $this->alertDBQueryConstraintData['query'] .= ' AND ';
            }

            $this->alertDBQueryConstraintData['query'] .= $sqlColumnName.' '.$sqlComparisonOperator.' ?';
            $this->alertDBQueryConstraintData['vals'][] = $constraintVal;
        }
    }

    public function getAlerts($alertID = 0, $alertType = null, $timeOptions = [ 'startTime' => null, 'endTime' => null ],
                              $nodeOptions = [ 'host' => null, 'src_node' => null, 'dst_node' => null ],
                              $queryOptions = [ 'orderBy' => 'created', 'limit' => 5 ])
    {
        /*
         *  Purpose: fetch alerts from Inquisition db using given constraints
         *
         *  Params:
         *      * $alertId :: INT :: ID of alert to fetch :: NOTE: all other parameters are not considered when an
         *          alert ID is specified
         *      * $startTime :: DateTime :: earliest time to show alerts for
         *      * $endTime :: DateTime :: oldest time to show alerts for
         *      * $alertType :: INT :: type of alert to search for ::
         *          ALERT_TYPE: 1 = host anomaly, 2 = traffic node anomaly, 3 = threat
         *      * $host :: STR :: host IP or hostname to filter alerts by
         *      * $src_node :: STR :: source IP or hostname to filter alerts by
         *      * $dst_node :: STR :: destination IP or hostname to filter alerts by
         *      * $limit :: INT :: maximum amount of alerts to display (0 = unlimited)
         *      * $orderBy :: STR :: fieldname to order results by :: DEFAULT: created timestamp
         *
         *  Returns: NONE
         *
         */

        $this->dbConn->dbQueryOptions['query'] =
            "
              SELECT 
               alert_id, created, updated, ATM.type_name as alert_type_name, host, src_node, dst_node, alert_detail, log_data 
              FROM Alerts 
              JOIN AlertTypeMapping ATM
              ON (Alerts.alert_type=ATM.type_id)
            ";

        // convert epoch timestamp if needed
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

        // set db query data
        if(!empty($this->alertDBQueryConstraintData['query']))
        {
            $this->dbConn->dbQueryOptions['query'] .= ' WHERE '.$this->alertDBQueryConstraintData['query'];
            $this->dbConn->dbQueryOptions['optionVals'] = $this->alertDBQueryConstraintData['vals'];
        }

        // append order by and limit clauses if needed
        if(!empty($queryOptions['orderBy']))
        {
            $this->dbConn->dbQueryOptions['query'] .= ' ORDER BY ?';
            $this->dbConn->dbQueryOptions['optionVals'][] = $queryOptions['orderBy'];
        }
        if(!empty($queryOptions['limit']) && 0 < $queryOptions['limit'])
        {
            $this->dbConn->dbQueryOptions['query'] .= ' LIMIT ?';
            $this->dbConn->dbQueryOptions['optionVals'][] = $queryOptions['limit'];
        }

        // get results
        $this->alertStore = $this->dbConn->runQuery();

        return $this->alertStore;
    }
}