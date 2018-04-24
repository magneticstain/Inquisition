<?php
namespace Perspective;

/**
 * View.php - the view portion of Celestial's MVC framework
 */

class View
{
    public $subTitle = 'Home';
    public $content = '';

    public function __construct($content, $subTitle = 'Home')
    {
        $this->subTitle = $subTitle;
        $this->content = $content;
    }

    public static function sanatizeDataForView($originalData)
    {
        /*
         *  Purpose: sanatize incoming data for use within browser html; should be used to protect against XSS
         *
         *  Params:
         * 		* $originalData :: ANY :: content that needs to be sanatized
         *
         *  Returns: ANY
         */

        return htmlentities($originalData, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public static function setHTTPHeaders($contentType = '', $cacheTime = 3600)
    {
        /*
         *  Purpose: set necessary HTTP headers; usually includes security and cache headers
         *
         *  Params:
         * 		* $contentType :: STR :: content-type header value to be used to specify what type of content is
         *          being served
         * 		* $cacheTime :: INT :: amount of time to store data for, in seconds (default = 3600s = 1 hour)
         *
         *  Returns: NONE
         */

        // SECURITY
        // HSTS
        header('strict-transport-security: max-age=2592000; includeSubDomains');

        // X-Frame-Options
        header('X-Frame-Options: sameorigin');

        // Browser XSS Protection
        header('X-XSS-Protection: 1');

        // Disable Content Sniffing (why IE...)
        header('X-Content-Type-Options: nosniff');

        // CSP
        // this has been set to only allow content to be loaded from the current subdomain EXCEPT XHR requests,
        // i.e. to the API, just in case the client wants to host the api on its own subdomain
        header('Content-Security-Policy: default-src \'self\'; connect-src https:;');

        // Cross-Domain Policies
        header('X-Permitted-Cross-Domain-Policies: none');

        // Referer Policy
        // https://scotthelme.co.uk/a-new-security-header-referrer-policy/
        header('Referrer-Policy: no-referrer');

        // CACHING
        // Cache-Control
        $cacheTime = (int) $cacheTime;
        header('Cache-Control: max-age='.$cacheTime);

        // PAYLOAD
        // Content-Type
        if(!empty($contentType))
        {
            header('Content-Type: '.$contentType);
        }
    }

    public function generateHTML()
    {
        /*
         *  Purpose: generate string of HTML to be displayed to the user
         *
         *  Params: NONE
         *
         *  Returns: string
         */

        return '
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name=viewport content="width=device-width, initial-scale=1">
        
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon">
        
        <link rel="stylesheet" href="/static/css/main.css" media="all">
        
        <title>'.$this->subTitle.' - Inquisition</title>
    </head>
    <body id="'.strtolower($this->subTitle).'">
        <div id="mainLoadingProgressBar"></div>
        <div id="mainErrorModal"></div>
        <header>
            <div id="headerWrapper">
                <div id="titleLogoWrapper">
                    <a href="/" title="Go to Inquisition homepage">
                        <img src="/static/imgs/title_logo.png" alt="Welcome to Inquisition">
                    </a>
                </div>
                <!--<div id="loginModule">-->
                    <!--Josh Carlson | logout-->
                <!--</div>-->
            </div>
        </header>
        <main>
            <div id="mainWrapper">
                <nav>
                    <div id="navContainer">
                        <a class="alerts" href="/alerts/">
                            <div class="alerts navOption selected">
                                <img src="/static/imgs/icons/alerts.svg" alt="View Current Alerts">
                                <span>Alerts</span>
                            </div>
                        </a>
                        <a class="stats" href="/stats/">
                            <div class="stats navOption">
                                <img src="/static/imgs/icons/stats.svg" alt="View Current Alerts">
                                <span>Stats</span>
                            </div>
                        </a>
                        <a class="tuning" href="/tuning/">
                            <div class="tuning navOption">
                                <img src="/static/imgs/icons/tuning.svg" alt="View Current Alerts">
                                <span>Tuning</span>
                            </div>
                        </a>
                    </div>
                </nav>
                <div id="contentWrapper">
                    '.$this->content.'
                </div>
            </div>
        </main>
        <footer>
            <div>
                <a href="https://opensource.org/licenses/MIT">MIT License</a> // <a href="https://github.com/magneticstain/Inquisition">Project on GitHub</a>
            </div>
        </footer>
    </body>
    <script defer src="/static/js/plugins/jquery-3.2.1.min.js"></script>
    <script defer src="/static/js/plugins/jquery.cookie.js"></script>
    <script defer src="/static/js/plugins/pace.min.js"></script>
    <script defer src="/static/js/plugins/jquery.timeago.js"></script>
    <script defer src="/static/js/plugins/Chart.bundle.min.js"></script>
    <script defer src="/static/js/plugins/toggles.min.js"></script>
    <script defer src="/static/js/lib/global.js"></script>
    <script defer src="/static/js/lib/errorbot.js"></script>
    <script defer src="/static/js/lib/mystic.js"></script>
    <script defer src="/static/js/lib/alerts.js"></script>
    <script defer src="/static/js/lib/stats.js"></script>
    <script defer src="/static/js/lib/tuning.js"></script>
    <script defer src="/static/js/lib/controller.js"></script>
    <script defer src="/static/js/lib/nav.js"></script>
    <script defer src="/static/js/main.js"></script>
</html>';
    }

    public function __toString()
    {
        // Overload of toString function in order to generate HTML when this class as an obj is treated as a string
        return $this->generateHTML();
    }
}