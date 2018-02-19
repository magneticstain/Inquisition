<?php
namespace Inquisition\Web;

/**
 * Index.php - main page of inquisition's web component
 */

$BASE_URL = $_SERVER['DOCUMENT_ROOT'];
require $BASE_URL.'/lib/Autoloader.php';

$normalizedContentTitle = null;
$contentHTML = '<div id="loadingContainer"></div>';

// try to generate web page
try {
    \Perspective\View::setHTTPHeaders();

    if(isset($_GET['content']))
    {
        $contentParam = $_GET['content'];

        $contentSubtitle = htmlentities($contentParam, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // format content as title
        $normalizedContentTitle = ucwords($contentSubtitle);
    }

    $view = new \Perspective\View($contentHTML, $normalizedContentTitle);

    echo $view;
} catch(\Exception $e) {
    error_log('Inquisition :: [ SEV: FATAL ] :: could not start web engine :: [ MSG: '.$e->getMessage().' ]');

    // throw 503 status
    http_response_code(503);

    exit(1);
}
