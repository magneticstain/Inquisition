<?php
namespace Inquisition\Web;

/**
 *  Stats API - endpoint for any statistics generated by Inquisition
 */

use API\Stats;

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

// set http headers
\Perspective\View::setHTTPHeaders('application/json', 30);

$errorMsg = '';
$publicErrorMsg = '';
$dbConn = null;
$statsHandler = null;

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
    $statsDbConn = \Cache::generateRedisConn(
        $cfg->configVals['log_database']['host'],
        $cfg->configVals['log_database']['port']
    );
}
catch(\Exception $e)
{
    $errorMsg = 'could not create stats db connection';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}

try
{
    $statsHandler = new Stats($dbConn, $statsDbConn);
}
catch(\Exception $e)
{
    $errorMsg = 'could not start stats engine';

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
    if((is_null($dbConn) && is_null($cache)) || is_null($statsHandler))
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
$statType = $statKey = $statName = null;
foreach($_GET as $key => $val)
{
    switch(strtolower($key))
    {
        case 'type':
        case 't':
            $statType = $val;
            break;

        case 'key':
        case 'k':
            $statKey = $val;
            break;

        case 'name':
        case 'n':
            $statName = $val;
            break;
    }
}

// try to fetch stats, serialize them, and return to the user
try
{
    $fetchedStats = $statsHandler->getStats($statType, $statKey, $statName);

    echo json_encode($fetchedStats);
}
catch(\Exception $e)
{
    error_log('[ SEV: CRIT ] could not fetch stats :: MSG: [ '.$e->getMessage().' ]');

    http_response_code(500);
}