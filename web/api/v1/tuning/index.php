<?php
namespace Inquisition\Web;

/**
 *  Tuning API - endpoint for retrieving or setting any Inquisition configuration setting
 */

use API\Tuning;

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

// set http headers
\Perspective\View::setHTTPHeaders('application/json', 30);

$publicErrorMsg = '';
$dbConn = $tuningHandler = null;

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
    $tuningHandler = new Tuning($cfg, $dbConn);
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

// check if error was generated
if(!empty($errorMsg))
{
    echo json_encode([
        'status' => 'fail',
        'error' => $publicErrorMsg
    ]);

    exit(1);
}

// try to perform tuning request, serialize results, and return to the user
try
{
    if(!empty($_GET))
    {
        // user is requesting data
        $tuningHandler->setTuningValues($_GET);
        try
        {
            if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx])
                && $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx] != 'cfg')
            {
                // user is requesting inquisition metadata
                $tuningHandler->getInquisitionMetadata();
            }
            else
            {
                $tuningHandler->getCfgVal();
            }
        } catch(\Exception $e)
        {
            http_response_code(403);

            echo json_encode([
                'status' => 'fail',
                'error' => $e->getMessage()
            ]);

            exit(1);
        }
    }
    elseif(!empty($_POST))
    {
        // user is trying to update data
        try
        {
            $tuningHandler->setTuningValues($_POST);

            if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx])
                && $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx] != 'cfg')
            {
                // user is requesting inquisition metadata
                $tuningHandler->updateInquisitionMetadata();
            }
            else
            {
                $tuningHandler->setCfgVal('/opt/inquisition/conf/main.cfg');
            }
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
        // no params set - just list available options and current config
        // read in current config as dataset first
        // then use those results as the config values in new result dataset
        $tuningHandler->getCfgVal();
        $tuningHandler->resultDataset['data'] = [
            'metadata' => $tuningHandler->possibleMetadataVals,
            'cfg' => $tuningHandler->resultDataset['data']
        ];
    }

    if(count($tuningHandler->resultDataset['data']) === 0)
    {
        // no results found
        http_response_code(404);
    }
    else {
        echo $tuningHandler;
    }
}
catch(\Exception $e)
{
    error_log('[ SEV: CRIT ] could not perform tuning procedure :: MSG: [ '.$e->getMessage().' ]');

    http_response_code(500);
}