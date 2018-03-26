<?php
namespace API;

/**
 *  API/Tuning.php - class for all logic related to Inquisition configuration CRUD
 */

class Tuning
{
    public $resultDataset = [
        'status' => '',
        'data_source' => '',
        'data' => []
    ];
    private $cfgHandler = null;
    public $cfgSection = '';
    public $cfgKey = '';
    public $cfgVal = null;
    public $possibleMetadataVals = [
        'types' => [
            'cfg',
            'parser',
            'template',
            'field',
            'ioc',
            'mapping',
            'known_host'
        ],
        'idFieldNames' => [
            'parser_id',
            'template_id',
            'field_id',
            'mapping_id',
            'host_id'
        ]
    ];
    public $metadataTypeIdx = 0;
    public $metadataID = 0;
    public $metadataSearchOpts = [
        'field' => '',
        'search_query' => ''
    ];


    public function __construct($cfg = null, $dbConn = null, $opts = null)
    {
        // start config handler
        if(!is_null($cfg))
        {
            $this->cfgHandler = $cfg;
        }
        else
        {
            $this->cfgHandler = new \Config();
        }

        if(is_null($dbConn))
        {
            // no db handler provided; try creating one w/ default options
            try
            {
                $this->dbConn = new \DB();
            }
            catch(\Exception $e)
            {
                // a database connection may not be completely needed if we have access to the cache,
                // though functionality will be degraded
                if(is_null($this->cache))
                {
                    throw new \Exception('no data sources available (cache or data store)');
                }
            }
        }
        else
        {
            $this->dbConn = $dbConn;
        }

        if(!is_null($opts))
        {
            // tuning vals provided
            $this->setTuningValues($opts);
        }
    }

    public function setTuningValues($tuningOpts)
    {
        /*
         *  Purpose:
         *      * sift through array and set tuning values accordingly
         *
         *  Params:
         *      * $tuningOpts :: ARRAY :: set of tuning values to apply
         *
         *  Returns: NONE
         *
         */

        foreach($tuningOpts as $optKey => $optVal)
        {
            switch(strtolower($optKey))
            {
                case 'section':
                case 's':
                    $this->cfgSection = $optVal;
                    break;

                case 'key':
                case 'k':
                    $this->cfgKey = $optVal;
                    break;

                case 'val':
                case 'v':
                    $this->cfgVal = $optVal;
                    break;

                case 'type':
                case 't':
                    foreach($this->possibleMetadataVals['types'] as $typeIdx => $type)
                    {
                        if($type === strtolower($optVal))
                        {
                            // type is valid, set index
                            $this->metadataTypeIdx = $typeIdx;

                            break;
                        }
                    }

                    break;

                case 'id':
                case 'i':
                    $this->metadataID = $optVal;
                    break;

                case 'field':
                case 'f':
                    $this->metadataSearchOpts['field'] = $optVal;
                    break;

                case 'search_query':
                case 'q':
                    $this->metadataSearchOpts['search_query'] = $optVal;
                    break;
            }
        }
    }

    // CONFIGS
    public function getCfgVal()
    {
        /*
         *  Purpose:
         *      * get config value using class vars as params
         *
         *  Params: NONE
         *
         *  Returns: NONE
         *
         */

        // define list of keys we should not return values for
        $bannedCfgKeys = [ 'sentry_api_key', 'db_pass' ];
        if(in_array($this->cfgKey, $bannedCfgKeys))
        {
            throw new \Exception('invalid configuration key provided; cannot show value for security purposes');
        }

        // check if no params were set; if so, return all configs
        if(empty($this->cfgSection) && empty($this->cfgKey))
        {
            $this->resultDataset['data'] = $this->cfgHandler->configVals;

            // redact any banned keys
            foreach($this->resultDataset['data'] as $cfgSection => $cfgSectionData)
            {
                foreach($bannedCfgKeys as $bannedKey)
                {
                    if(array_key_exists($bannedKey, $cfgSectionData))
                    {
                        $this->resultDataset['data'][$cfgSection][$bannedKey] = '<REDACTED>';
                    }
                }
            }
        }
        else
        {
            // try to find the cfg val if allowed
            if(isset($this->cfgHandler->configVals[$this->cfgSection][$this->cfgKey]))
            {
                $this->resultDataset['data'] = $this->cfgHandler->configVals[$this->cfgSection][$this->cfgKey];
            }
        }
    }

    public function setCfgVal($cfgFilename = '/opt/inquisition/conf/main.cfg')
    {
        /*
         *  Purpose:
         *      * set config value using class vars as params
         *
         *  Params:
         *      * $cfgFilename :: STR :: filename of config file to read in
         *
         *  Returns: BOOL
         *
         */

        $cfgSetSuccessful = false;

        // open config file
        if(file_exists($cfgFilename))
        {
            // try updating config
            if(!$this->cfgHandler->updateToConfigFile($cfgFilename, $this->cfgSection, $this->cfgKey, $this->cfgVal))
            {
                // update failed :(
                $this->resultDataset['status'] = 'fail';
                $this->resultDataset['data'] = 'failed to update configuration file';
            }
            else
            {
                $cfgSetSuccessful = true;
            }
        }
        else
        {
            throw new \Exception('config file not found :: [ FILENAME: '.$cfgFilename.' ]');
        }

        return $cfgSetSuccessful;
    }

    // INQUISITION METADATA (TEMPLATES, PARSERS, ETC)
    public function getSqlInfoForMetadataType($metadataType)
    {
        /*
         *  Purpose:
         *      * translate metadata type to table name and ID field
         *
         *  Params:
         *      * $metadataType :: STR :: metadata type to get table name for
         *
         *  Returns: STR
         *
         */

        $typeData = [
            'tableName' => '',
            'idFieldName' => ''
        ];

        switch($metadataType)
        {
            case 'parser':
                $typeData['tableName'] = 'Parsers';
                $typeData['idFieldName'] = 'parser_id';

                break;
            case 'template':
                $typeData['tableName'] = 'FieldTemplates';
                $typeData['idFieldName'] = 'template_id';

                break;
            case 'field':
                $typeData['tableName'] = 'Fields';
                $typeData['idFieldName'] = 'field_id';

                break;
            case 'ioc':
                $typeData['tableName'] = 'IOCItemToFieldMapping';
                $typeData['idFieldName'] = 'mapping_id';

                break;
            case 'mapping':
                $typeData['tableName'] = 'ParserToFieldTemplateMapping';
                $typeData['idFieldName'] = 'mapping_id';

                break;
            case 'known_host':
                $typeData['tableName'] = 'KnownHosts';
                $typeData['idFieldName'] = 'host_id';

                break;
            default:
                throw new \Exception('invalid metadata type provided');
        }

        return $typeData;
    }

    public function getInquisitionMetadata()
    {
        /*
         *  Purpose:
         *      * get specifed data from Inquisition DB
         *
         *  Params: NONE
         *
         *  Returns: NONE
         *
         */

        $metadataType = $this->possibleMetadataVals['types'][$this->metadataTypeIdx];
        $sqlWhereClause = '';
        $sqlInputData = [];

        // generate sql query
        if($metadataType != 'cfg')
        {
            // not setup for configuration queries, so we're good
            // get table name
            $sqlQueryData = $this->getSqlInfoForMetadataType($metadataType);

            // check if identifier is set; if not, try search params
            if(0 < $this->metadataID)
            {
                $sqlWhereClause = 'WHERE '.$sqlQueryData['idFieldName'].' = ?';
                array_push($sqlInputData, $this->metadataID);
            }

            $this->dbConn->dbQueryOptions['query'] = "
                  /* Celestial // Tuning.php // Fetch metadata */
                  SELECT 
                    *
                  FROM ".$sqlQueryData['tableName']."
                   ".$sqlWhereClause." 
            ";
            $this->dbConn->dbQueryOptions['optionVals'] = $sqlInputData;

            $this->resultDataset['data'] = $this->alertStore = $this->dbConn->runQuery();
        }
    }

    // OTHER FUNCTIONS
    public function __toString()
    {
        return json_encode($this->resultDataset);
    }
}