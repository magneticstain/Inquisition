<?php
namespace API;

/**
 *  API/Tuning.php - class for all logic related to Inquisition configuration CRUD
 */

class Tuning
{
    private $cfgHandler = null;

    public function __construct()
    {
        // start config handler
        $this->cfgHandler = new \Config();
    }

    public function getCfgVal($cfgSection, $cfgKey)
    {
        /*
         *  Purpose:
         *      * get config value using class vars as params
         *
         *  Params:
         *      * $cfgSection :: STR :: section in config file to look
         *      * $cfgKey :: STR :: key within config section to get value of
         *
         *  Returns: ANY
         *
         */

        // define list of keys we should not return values for
        $bannedCfgKeys = [ 'db_pass' ];
        if(in_array($cfgKey, $bannedCfgKeys))
        {
            throw new \Exception('banned configuration key provided; cannot show for security purposes');
        }

        // API response format framework: https://labs.omniti.com/labs/jsend
        $cfgValDataset = [
            'status' => 'success',
            'data_source' => 'default',
            'data' => []
        ];

        // try to find the cfg val if allowed
        if(isset($this->cfgHandler->configVals[$cfgSection][$cfgKey]))
        {
            $cfgValDataset['data'] = $this->cfgHandler->configVals[$cfgSection][$cfgKey];
        }

        return $cfgValDataset;
    }

    public function setCfgVal()
    {
        /*
         *  Purpose:
         *      * set config value using class vars as params
         *
         *  Params: NONE
         *
         *  Returns: BOOL
         *
         */

        $cfgValSetResultDataset = [
            'status' => 'success',
            'data_source' => 'default',
            'data' => []
        ];

        return $cfgValSetResultDataset;
    }
}