<?php
namespace Inquisition\Web;

/**
 *  Tuning API - endpoint for retrieving or setting any Inquisition configuration setting
 */

use API\Tuning;

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

// set http headers for api response
\Perspective\View::setHTTPHeaders('application/json', 0);

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
$httpMethod = $_SERVER['REQUEST_METHOD'];
try
{
    switch($httpMethod)
    {
        case 'GET':
            // user is requesting data
            try
            {
                if(empty($_GET))
                {
                    // no params set - just list available options and current config
                    // read in current config as dataset first
                    // then use those results as the config values in new result dataset
                    $tuningHandler->getCfgVal();
                    $tuningHandler->resultDataset['data'] = [
                        'available_types' => $tuningHandler->possibleMetadataVals['types'],
                        'id_field_names' => $tuningHandler->possibleMetadataVals['idFieldNames'],
                        'current_cfg' => $tuningHandler->resultDataset['data']
                    ];
                }
                else
                {
                    $tuningHandler->setTuningValues($_GET);
                    $metadataType = null;

                    if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx]))
                    {
                        $targetMetadataType = $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx];

                        if($targetMetadataType === 'all')
                        {
                            // set append flag so each data grab doesn't overwrite old data
                            $tuningHandler->appendNewData = true;

                            // get data for all metadata types
                            foreach($tuningHandler->possibleMetadataVals['types'] as $metadataType)
                            {
                                // skip if type is 'all' since it's redundant
                                if($metadataType === 'all')
                                {
                                    continue;
                                }

                                // update metadata type within handler
                                $tuningHandler->setMetadataTypeIdx($metadataType);

                                // fetch data
                                if($metadataType === 'cfg')
                                {
                                    $tuningHandler->getCfgVal();
                                }
                                else
                                {
                                    $tuningHandler->getInquisitionMetadata();
                                }
                            }
                        }
                        elseif($targetMetadataType != 'cfg')
                        {
                            // user is (at least) requesting inquisition metadata
                            $tuningHandler->getInquisitionMetadata();
                        }
                    }

                    if(is_null($targetMetadataType) || $targetMetadataType === 'cfg')
                    {
                        // configs (also) requested
                        $tuningHandler->getCfgVal();
                    }
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

            break;
        case 'POST':
            // user is trying to update data
            try
            {
                $tuningHandler->setTuningValues($_POST);

                if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx])
                    && $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx] != 'cfg')
                {
                        // data is assumed to be being updated
                        $tuningHandler->updateInquisitionMetadata();
                }
                else
                {
                    $tuningHandler->modifyCfgVal('/opt/inquisition/conf/main.cfg', 'set');
                }
            }
            catch(\Exception $e)
            {
                $errorMsg = $e->getMessage();
            }

            break;
        case 'PUT':
            // user is trying to update data
            try
            {
                parse_str(file_get_contents('php://input'), $_PUT);
                $tuningHandler->setTuningValues($_PUT);

                if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx])
                    && $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx] != 'cfg')
                {
                    // attempt to create new record with data
                    $tuningHandler->insertInquisitionMetadata();
                }
                else
                {
                    $tuningHandler->modifyCfgVal('/opt/inquisition/conf/main.cfg', 'add');
                }
            }
            catch(\Exception $e)
            {
                $errorMsg = $e->getMessage();
            }

            break;
        case 'DELETE':
            // user is trying to update data
            try
            {
                parse_str(file_get_contents('php://input'), $_DELETE);
                $tuningHandler->setTuningValues($_DELETE);

                if(isset($tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx])
                    && $tuningHandler->possibleMetadataVals['types'][$tuningHandler->metadataTypeIdx] != 'cfg')
                {
                    // attempt to create new record with data
                    $tuningHandler->deleteInquisitionMetadata();
                }
                else
                {
                    $tuningHandler->modifyCfgVal('/opt/inquisition/conf/main.cfg', 'delete');
                }
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