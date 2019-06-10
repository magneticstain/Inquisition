<?php
namespace Inquisition\Web;

/**
 * Index.php - main page of inquisition's web component: Celestial
 */

require $_SERVER['DOCUMENT_ROOT'].'/lib/Autoloader.php';

$normalizedContentTitle = null;
$contentHTML = '<div id="loadingContainer"></div>';

// try to generate web page
try {
    \Perspective\View::setHTTPHeaders();

    if(isset($_GET['content']))
    {
        // format content as title
        $normalizedContentTitle = \Perspective\View::sanatizeDataForView($_GET['content']);
    }

    $view = new \Perspective\View($contentHTML, $normalizedContentTitle);

    echo $view;
} catch(\Exception $e) {
    error_log('[ SEV: FATAL ] could not start web engine :: [ MSG: '.$e->getMessage().' ]');
    http_response_code(503);
    exit(1);
}
