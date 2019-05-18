<?php
namespace Inquisition\Web;

/**
 *  Alerts API - endpoint for alert-related functionality
 */

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

$errorMsg = '';
$publicErrorMsg = '';
$dbConn = null;
$cache = null;
$alertsHandler = null;

try
{
    $cfg = new \Config();
}
catch(\Exception $e)
{
    $errorMsg = 'could not read configurations';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}

// set http headers
$cacheTimeout = 15;
if(isset($cfg->configVals['caching']['alert_expiration']))
{
    $cacheTimeout = $cfg->configVals['caching']['alert_expiration'];
}
\Perspective\View::setHTTPHeaders('application/json', $cacheTimeout);

// try to start and create needed engines and connections
try
{
    $cache = new \Cache(
        $cacheTimeout,
        null,
        $cfg->configVals['log_database']['host'],
        $cfg->configVals['log_database']['port']
    );
}
catch(\Predis\Connection\ConnectionException $e)
{
    $errorMsg = 'unable to connect to in-memory DB for caching';

    error_log($errorMsg.' :: [ MSG: { '.$e->getMessage().' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}
catch(\Exception $e)
{
    $errorMsg = 'could not start caching engine';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}

try
{
    $dbConn = new \DB(
        $cfg->configVals['mysql_database']['db_host'],
        $cfg->configVals['mysql_database']['db_port'],
        $cfg->configVals['mysql_database']['db_name'],
        $cfg->configVals['mysql_database']['db_user'],
        $cfg->configVals['mysql_database']['db_pass']
    );
}
catch(\PDOException $e)
{
    $errorMsg = 'could not create database connection';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    $publicErrorMsg = $errorMsg;
}

try
{
    $alertsHandler = new \API\Alerts($dbConn, $cache);
}
catch(\Exception $e)
{
    $errorMsg = 'could not start alerts engine';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}

// check if error was generated and both cache and DB is not available
if(!empty($errorMsg))
{
    // error was generated
    if((is_null($dbConn) && is_null($cache)) || is_null($alertsHandler))
    {
        // no chance of grabbing the data - die
        echo json_encode([
            'status' => 'fail',
            'error' => $publicErrorMsg
        ]);

        exit(1);
    }
}

// process incoming get vars
$alertID = null;
$alertType = null;
$startTime = null;
$endTime = null;
$host = null;
$src = null;
$dst = null;
$orderBy = 'created';
$placement = 'ASC';
$resultLimit = 5;

foreach($_GET as $key => $val)
{
    switch(strtolower($key))
    {
        case 'id':
        case 'i':
            $alertID = $val;
            break;

        case 'type':
        case 't':
            $alertType = $val;
            break;

        case 'after':
        case 'a':
            $startTime = $val;
            break;

        case 'before':
        case 'b':
            $endTime = $val;
            break;

        case 'host':
        case 'h':
            $host = $val;
            break;

        case 'src':
        case 's':
            $src = $val;
            break;

        case 'dst':
        case 'd':
            $dst = $val;
            break;

        case 'order':
        case 'o':
            $orderBy = $val;
            break;

        case 'placement':
        case 'p':
            $placement = $val;
            break;

        case 'limit':
        case 'l':
            $resultLimit = $val;
            break;
    }
}

// try to fetch alerts, serialize them, and return to the user
$httpMethod = $_SERVER['REQUEST_METHOD'];
try
{
    switch($httpMethod)
    {
        case 'GET':
            // user is requesting data

            $fetchedAlerts = $alertsHandler->getAlerts($alertID, $alertType,
                [ 'startTime' => $startTime, 'endTime' => $endTime ],
                [ 'host' => $host, 'src_node' => $src, 'dst_node' => $dst ],
                [ 'orderBy' => $orderBy, 'placement' => $placement, 'limit' => $resultLimit ]
            );

            break;
        case 'DELETE':
            // user is trying to update data
            try
            {
                $fetchedAlerts = $alertsHandler->deleteAlert($alertID);
            }
            catch(\Exception $e)
            {
                $errorMsg = $e->getMessage();
            }

            break;
        default:
            $errorMsg = 'unknown HTTP method provided';
    }

    if(!empty($errorMsg))
    {
        http_response_code(400);

        echo json_encode([
            'status' => 'fail',
            'error' => $errorMsg
        ]);

        exit(1);
    }

    if($httpMethod !== 'DELETE' && (isset($_GET['i']) || isset($_GET['id'])) && count($fetchedAlerts['data']) === 0)
    {
        // no results found
        http_response_code(404);
    }
    else
    {
        echo json_encode($fetchedAlerts);
    }
}
catch(\PDOException $e)
{
    error_log('[ SEV: CRIT ] could not fetch alerts from Inquisition database :: [ QUERY: { '
        .$alertsHandler->dbConn->dbQueryOptions['query'].' } :: MSG: [ '.$e->getMessage().' ]');

    http_response_code(500);
}