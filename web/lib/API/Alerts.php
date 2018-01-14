<?php

namespace API;

/**
 *  API/Alerts.php - API submodule library for alert-related logic
 */

class Alerts
{
    public $dbConn = null;
    public $alertStore = [];

    public function __construct()
    {
        $this->dbConn = new DB();
    }

    public function getAlerts($alertID = 0, $startTime = null, $endTime = null, $alertType = 0,
                              $host = null, $src = null, $dst = null, $orderBy = 'created', $limit = 5)
    {
        /*
         *  Purpose: fetch alerts from Inquisition db using given constraints
         *
         *  Params:
         *      * $alertId :: INT :: ID of alert to fetch :: NOTE: all other parameters are not considered when an
         *          alert ID is specified
         *      * $startTime :: DateTime :: earliest time to show alerts for
         *      * $endTime :: DateTime :: oldest time to show alerts for
         *      * $alertType :: INT :: type of alert to search for ::
         *          ALERT_TYPE: 0 = host anomaly, 1 = traffic node anomaly, 2 = threat
         *      * $host :: STR :: host IP or hostname to filter alerts by
         *      * $src :: STR :: source IP or hostname to filter alerts by
         *      * $dst :: STR :: destination IP or hostname to filter alerts by
         *      * $limit :: INT :: maximum amount of alerts to display (0 = unlimited)
         *      * $orderBy :: STR :: fieldname to order results by :: DEFAULT: created timestamp
         *
         *  Returns: NONE
         *
         */

        $sql = "";
    }
}