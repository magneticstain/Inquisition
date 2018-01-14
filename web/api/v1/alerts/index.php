<?php
namespace Inquisition\Web\API;

/**
 *  Alerts API - endpoint for alert-related functionality
 */

$BASE_URL = $_SERVER['DOCUMENT_ROOT'];
require $BASE_URL.'/lib/Autoloader.php';

# CONF

try
{
    $alerts = new \API\Alerts();
} catch(\PDOException $e)
{
    error_log('could not connect to Inquisition database :: [ '.$e->getMessage().' ]');

    http_response_code(503);
}