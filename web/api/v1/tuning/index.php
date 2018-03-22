<?php
namespace Inquisition\Web;

/**
 *  Tuning API - endpoint for retrieving or setting any Inquisition configuration setting
 */

use API\Tuning;

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

// set http headers
\Perspective\View::setHTTPHeaders('application/json', 30);

$errorMsg = '';
$publicErrorMsg = '';
$tuningHandler = null;

try
{
    $tuningHandler = new Tuning();
}
catch(\Exception $e)
{
    $errorMsg = 'could not start tuning engine';

    error_log($errorMsg.' :: [ MSG: { '.$e.' } ]');
    if(!empty($publicErrorMsg))
    {
        $publicErrorMsg .= '; ';
    }
    $publicErrorMsg .= $errorMsg;
}

// process incoming get and post vars
$httpMethod = $tuningCfgSect = $tuningCfgKey = $tuningCfgVal = null;
foreach($_GET as $key => $val)
{
    $httpMethod = 'GET';
    switch(strtolower($key))
    {
        case 'section':
        case 's':
            $tuningCfgSect = $val;
            break;

        case 'key':
        case 'k':
            $tuningCfgKey = $val;
            break;
    }
}
foreach($_POST as $key => $val)
{
    $httpMethod = 'POST';
    switch(strtolower($key))
    {
        case 'section':
        case 's':
            $tuningCfgSect = $val;
            break;

        case 'key':
        case 'k':
            $tuningCfgKey = $val;
            break;

        case 'value':
        case 'v':
            $tuningCfgVal = $val;
            break;
    }
}

// try to perform tuning request, serialize results, and return to the user
try
{
    if($httpMethod === 'GET')
    {
        try
        {
            $tuningResults = $tuningHandler->getCfgVal($tuningCfgSect, $tuningCfgKey);
        }
        catch(\Exception $e)
        {
            http_response_code(403);

            echo json_encode([
                'status' => 'fail',
                'error' => $e->getMessage()
            ]);

            exit(1);
        }
    }
    else
    {
        try
        {
            $tuningResults = $tuningHandler->setCfgVal('/opt/inquisition/conf/main.cfg', $tuningCfgSect, $tuningCfgKey,
                $tuningCfgVal);
        }
        catch(\Exception $e)
        {
            http_response_code(403);

            echo json_encode([
                'status' => 'fail',
                'error' => $e->getMessage()
            ]);

            exit(1);
        }
    }

    if(count($tuningResults['data']) === 0)
    {
        // no results found
        http_response_code(404);
    }
    else {
        echo json_encode($tuningResults);
    }
}
catch(\Exception $e)
{
    error_log('[ SEV: CRIT ] could not perform tuning procedure :: MSG: [ '.$e->getMessage().' ]');

    http_response_code(500);
}