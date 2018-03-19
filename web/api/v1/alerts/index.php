<?php
namespace Inquisition\Web;

/**
 *  Alerts API - endpoint for alert-related functionality
 */

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

// set http headers
\Perspective\View::setHTTPHeaders('application/json', 15);

$errorMsg = '';
$publicErrorMsg = '';
$dbConn = null;
$cache = null;
$alertsHandler = null;

$cfg = new \Config();
// try to start and create needed engines and connections
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
    $cache = new \Cache(
        null,
        $cfg->configVals['log_database']['host'],
        $cfg->configVals['log_database']['port']
    );
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
try
{
    $fetchedAlerts = $alertsHandler->getAlerts($alertID, $alertType,
        [ 'startTime' => $startTime, 'endTime' => $endTime ],
        [ 'host' => $host, 'src_node' => $src, 'dst_node' => $dst ],
        [ 'orderBy' => $orderBy, 'placement' => $placement, 'limit' => $resultLimit ]
    );

    if(count($fetchedAlerts['data']) === 0)
    {
        // no results found
        http_response_code(404);
    }
    else {
        echo json_encode($fetchedAlerts);
    }
}
catch(\PDOException $e)
{
    error_log('[ SEV: CRIT ] could not fetch alerts from Inquisition database :: [ QUERY: { '
        .$alertsHandler->dbConn->dbQueryOptions['query'].' } :: MSG: [ '.$e->getMessage().' ]');

    http_response_code(500);
}