<?php
namespace Inquisition\Web;

/**
 * Index.php - main page of inquisition's web component
 */

$BASE_URL = $_SERVER['DOCUMENT_ROOT'];
require $BASE_URL.'/lib/Autoloader.php';

$contentHTML = '    
                    <div class="loadingContainer">
                        <div class="large loadingModule">
                            <img src="static/imgs/icons/loading.svg" alt="Loading content..." title="Loading content, please wait...">
                            <p>loading, please wait...</p>
                        </div>
                    </div>
';

// try to generate web page
try {
    \Perspective\View::setHTTPHeaders();

    $view = new \Perspective\View($contentHTML);

    echo $view;
} catch(\Exception $e) {
    error_log('Inquisition :: [ SEV: FATAL ] :: could not start web engine :: [ MSG: '.$e->getMessage().' ]');

    // throw 503 status
    http_response_code(503);

    exit(1);
}
