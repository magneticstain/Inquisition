<?php
/**
 *  Config.php - library for reading in and manipulating config values
 */

class Config
{
    public $configVals = [];

    public function __construct($configFile = '')
    {
        if(empty($configFile))
        {
            // use default file
            $configFile = '/opt/inquisition/conf/main.cfg';
        }

        // try to read in configs
        if(!$this->readConfigFile($configFile))
        {
            throw new \Exception('could not read configuration file');
        }
    }

    public function readConfigFile($configFilename)
    {
        /*
         *  Purpose: read in and parse configuration file
         *
         *  Params:
         *      * $configFileName :: STR :: filename of config file to read in
         *
         *  Returns: BOOL
         *
         */

        if(file_exists($configFilename))
        {
            if($this->configVals = parse_ini_file($configFilename, true, INI_SCANNER_RAW))
            {
                return true;
            }
            else
            {
                error_log('[ SEV: CRIT ] :: could not parse config file :: [ FILENAME: '.$configFilename.' ]');
            }
        }
        else
        {
            error_log('[ SEV: CRIT ] :: could not find config file :: [ FILENAME: '.$configFilename.' ]');
        }

        return false;
    }

    public function updateConfigFile($action = 'set', $configFileName = '/opt/inquisition/conf/main.cfg',
                                     $configSection, $configKey, $configVal)
    {
        /*
         *  Purpose: reads in and parses configuration file and updated given config
         *
         *  Params:
         *      * $action :: STR :: action to take on given config; [ 'set', 'delete', 'add' ]
         *      * $configFileName :: STR :: filename of config file to read in
         *      * $configSection :: STR :: section config is in
         *      * $configKey :: STR :: config key to update
         *      * $configVal :: STR :: value to update config to
         *
         *  Returns: BOOL
         *
         */

        $configChanged = false;
        $blankLineRegex = '/^$/';
        $commentRegex = '/^;[\S ]+/';
        $sectionNameRegex = '/^\[([\S]+)\]$/';
        $cfgKeyRegex = '/^([\w-]+) = [\S ]+$/';

        // get file contents
        try
        {
            if(! $cfgFileContents = file($configFileName))
            {
                return false;
            }
        }
        catch(Exception $e)
        {
            error_log('[ SEV: CRIT ] :: error processing config file during update :: [ FILENAME: '.$configFileName.
                ' ]');

            return false;
        }

        // traverse lines and update where needed
        $sectionMatched = false;
        $action = strtolower($action);
        foreach($cfgFileContents as $lineNum => $cfgFileLine)
        {
            // check for blank lines or comments
            if(!preg_match($blankLineRegex, $cfgFileLine) && !preg_match($commentRegex, $cfgFileLine))
            {
                // check if line contains section
                if(preg_match($sectionNameRegex, $cfgFileLine, $matchedSectionNameSet))
                {
                    // DEV NOTE: the [0] match in the set is the entire regex that matched
                    if($matchedSectionNameSet[1] === $configSection)
                    {
                        // section matched, update flag
                        $sectionMatched = true;
                    } else
                    {
                        $sectionMatched = false;
                    }
                }

                if($sectionMatched)
                {
                    if($action === 'add')
                    {
                        // insert config
                        array_splice($cfgFileContents, $lineNum + 1, 0, $configKey.' = '.$configVal."\n");
                        $configChanged = true;
                        break;
                    }
                    else
                    {
                        // if section was previously matched, and this isn't a new section, we'll assume it's a name and
                        // see if it matches
                        if(preg_match($cfgKeyRegex, $cfgFileLine, $matchedCfgKey))
                        {
                            // config key found
                            if($matchedCfgKey[1] === $configKey)
                            {
                                // config key matches
                                // take action based on param
                                switch($action)
                                {
                                    case 'set':
                                        // overwrite config line with new value (make sure to include the newline !!!)
                                        $cfgFileContents[$lineNum] = $matchedCfgKey[1] . ' = ' . $configVal . "\n";

                                        break;
                                    case 'delete':
                                        $cfgFileContents[$lineNum] = '';

                                        break;
                                }

                                // set updated flag
                                $configChanged = true;

                                // break since we've already found our value
                                break;
                            }
                        }
                    }
                }
            }
        }

        // write config file to disk
        file_put_contents($configFileName, $cfgFileContents);

        if(!$configChanged)
        {
            $priErrorMsg = 'no config found with specified parameters';
            error_log('[ SEV: WARN ] :: '.$priErrorMsg.' for Tuning API configuration change request :: [ SECTION: '.
                $configSection.' // KEY: '.$configKey.' // NEW VAL: '.$configVal.' ]');
            throw new Exception($priErrorMsg);
        }

        return $configChanged;
    }
}