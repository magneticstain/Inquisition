<?php
namespace API;

/**
 *  API/Tuning.php - class for all logic related to Inquisition configuration CRUD
 */

class Tuning
{
    public $resultDataset = [
        'status' => 'success',
        'data_source' => 'default',
        'data' => []
    ];
    public $appendNewData = false;
    private $cfgHandler = null;
    public $cfgSection = '';
    public $cfgVal = null;
    public $possibleMetadataVals = [
        'types' => [
            'all',
            'cfg',
            'parser',
            'template',
            'regex',
            'field',
            'field_type',
            'ioc_field_mapping',
            'parser_template_mapping',
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
    public $key = null;
    public $val = null;
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

        // TODO: add support for caching of tuning data
        $this->cache = null;

        if(is_null($dbConn))
        {
            // no db handler provided; try creating one w/ default options
            try
            {
                $this->dbConn = new \DB();
            }
            catch(\Exception $e)
            {
                error_log('[ SEV: CRIT ] :: no data sources available :: [ MSG: '.$e->getMessage().' ]');
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

    public function validateJSON($encodedData)
    {
        /*
         *  Purpose:
         *      * checks to see if value is valid json; returns decoded json if it is, raw val if it isn't
         *
         *  Params:
         *      * $encodedData :: $STR :: raw json data
         *
         *  Returns: ANY
         *
         */

        $deserializedData = json_decode($encodedData, true);
        if(json_last_error() != JSON_ERROR_NONE)
        {
            // not json
            return $encodedData;
        }
        else
        {
            return $deserializedData;
        }
    }

    public function setMetadataTypeIdx($metadataType)
    {
        /*
         *  Purpose:
         *      * set type index object value based on given metadata type
         *
         *  Params:
         *      * $metadataType :: STR :: metatdata type to set index for
         *
         *  Returns: INT || BOOL
         *
         */

        $typeFound = false;

        foreach($this->possibleMetadataVals['types'] as $typeIdx => $type)
        {
            if($type === strtolower($metadataType))
            {
                // type is valid, set index
                $this->metadataTypeIdx = $typeIdx;
                $typeFound = true;

                break;
            }
        }

        // return a value along with setting obj val
        if($typeFound)
        {
            return $typeIdx;
        }
        else
        {
            return false;
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

        $optFound = false;

        foreach($tuningOpts as $optKey => $optVal)
        {
            switch(strtolower($optKey))
            {
                case 'section':
                case 's':
                    $this->cfgSection = $optVal;
                    $optFound = true;
                    break;

                case 'type':
                case 't':
                    $this->setMetadataTypeIdx($optVal);
                    $optFound = true;
                    break;

                case 'id':
                case 'i':
                    $this->metadataID = $optVal;
                    $optFound = true;
                    break;

                case 'key':
                case 'k':
                    $this->key = $this->validateJSON($optVal);
                    $optFound = true;
                    break;

                case 'val':
                case 'v':
                    $this->val = $this->validateJSON($optVal);
                    $optFound = true;
                    break;
                default:
                    error_log('[ SEV: WARN ] :: invalid tuning option provided :: [ KEY: '.$optKey.' // VAL: '.$optVal
                        .' ]');
            }
        }

        return $optFound;
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

        $results = null;

        // define list of keys we should not return values for
        $bannedCfgKeys = [ 'sentry_api_key', 'db_pass' ];
//        if(in_array($this->key, $bannedCfgKeys))
//        {
//            throw new \Exception('invalid configuration key provided; cannot show value for security purposes');
//        }

        // check if no params were set; if so, return all configs
        if(empty($this->key))
        {
            if(empty($this->cfgSection))
            {
                $results = $this->cfgHandler->configVals;
            }
            else
            {
                // get all cfg values from given section
                if(isset($this->cfgHandler->configVals[$this->cfgSection]))
                {
                    $results = $this->cfgHandler->configVals[$this->cfgSection];
                }
            }
        }
        else
        {
            // try to find the cfg val if allowed
            if(isset($this->cfgHandler->configVals[$this->cfgSection][$this->key]))
            {
                // must be set as array in order to be traversed for banned keys below
                $results = $this->cfgHandler->configVals[$this->cfgSection][$this->key];
            }
        }

        // redact any banned keys
        // we only have to do this for arrays since specific keys that are set get caught above
        if(is_array($results))
        {
            foreach($results as $cfgKey => $cfgData)
            {
                foreach($bannedCfgKeys as $bannedKey)
                {
                    if(is_array($cfgData))
                    {
                        // we're looking at a full section of data, not an individual config key-val pair
                        if(array_key_exists($bannedKey, $cfgData))
                        {
                            $results[$cfgKey][$bannedKey] = '<REDACTED>';
                        }
                    }
                    else
                    {
                        // config key-value pair; check config key directly
                        if($cfgKey === $bannedKey)
                        {
                            $results[$cfgKey] = '<REDACTED>';
                        }
                    }
                }
            }
        }

        // check if the user is requesting everything, in which we should append to the dataset instead of overwrite it
        if($this->appendNewData)
        {
            $this->resultDataset['data']['cfg'] = $results;
        }
        else
        {
            $this->resultDataset['data'] = $results;
        }

        return $results;
    }

    public function modifyCfgVal($cfgFilename = '/opt/inquisition/conf/main.cfg', $actionToTake = 'update')
    {
        /*
         *  Purpose:
         *      * set config value using class vars as params
         *
         *  Params:
         *      * $cfgFilename :: STR :: filename of config file to read in
         *      * $actionToTake :: STR :: action to take on given config; [ 'set', 'delete', 'add' ]
         *
         *  Returns: BOOL
         *
         */

        $cfgSetSuccessful = false;

        // open config file
        if(file_exists($cfgFilename))
        {
            // try updating config
            if(!$this->cfgHandler->updateConfigFile($actionToTake, $cfgFilename, $this->cfgSection, $this->key,
                $this->val))
            {
                // update failed :(
                $this->resultDataset['status'] = 'fail';
                $this->resultDataset['data'] = 'failed to update configuration file';
            }
            else
            {
                $cfgSetSuccessful = $this->resultDataset['data'] = true;
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

        switch(strtolower($metadataType))
        {
            case 'parser':
                $typeData['tableName'] = 'Parsers';
                $typeData['idFieldName'] = 'parser_id';

                break;
            case 'template':
                $typeData['tableName'] = 'FieldTemplates';
                $typeData['idFieldName'] = 'template_id';

                break;
            case 'regex':
                $typeData['tableName'] = 'FieldTemplateRegex';
                $typeData['idFieldName'] = 'regex_id';

                break;
            case 'field':
                $typeData['tableName'] = 'Fields';
                $typeData['idFieldName'] = 'field_id';

                break;
            case 'field_type':
                $typeData['tableName'] = 'FieldTypes';
                $typeData['idFieldName'] = 'type_id';

                break;
            case 'ioc_field_mapping':
                $typeData['tableName'] = 'IOCItemToFieldMapping';
                $typeData['idFieldName'] = 'mapping_id';

                break;
            case 'parser_template_mapping':
                $typeData['tableName'] = 'ParserToFieldTemplateMapping';
                $typeData['idFieldName'] = 'mapping_id';

                break;
            case 'known_host':
                $typeData['tableName'] = 'KnownHosts';
                $typeData['idFieldName'] = 'host_id';

                break;
        }

        return $typeData;
    }

    public function getInquisitionMetadata()
    {
        /*
         *  Purpose:
         *      * get specified data from Inquisition DB
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

            // check for field names (keys)
            if(!is_null($this->key))
            {
                $columnNameClause = $this->key;
            }
            else
            {
                // no column names set to fetch so we'll get all columns
                $columnNameClause = '*';
            }

            // check if identifier is set; if not, try search params
            if(0 < $this->metadataID)
            {
                $sqlWhereClause = 'WHERE '.$sqlQueryData['idFieldName'].' = ?';
                array_push($sqlInputData, $this->metadataID);
            }

            $this->dbConn->dbQueryOptions['query'] = "
                  /* Celestial // Tuning.php // Fetch Metadata */
                  SELECT 
                    ".$columnNameClause."
                  FROM ".$sqlQueryData['tableName']."
                   ".$sqlWhereClause." 
            ";
            $this->dbConn->dbQueryOptions['optionVals'] = $sqlInputData;

            $results = $this->dbConn->runQuery();

            if($this->appendNewData)
            {
                $this->resultDataset['data'][$metadataType] = $results;
            }
            else
            {
                $this->resultDataset['data'] = $results;
            }
        }
    }

    public function insertInquisitionMetadata()
    {
        /*
         *  Purpose:
         *      * insert specified data into Inquisition DB
         *
         *  Params: NONE
         *
         *  Returns: INT
         *
         */

        $insertID = false;

        $metadataType = $this->possibleMetadataVals['types'][$this->metadataTypeIdx];
        $sqlInputData = [];

        // generate sql query
        if($metadataType != 'cfg')
        {
            // not setup for configuration queries, so we're good
            // get table name
            $sqlQueryData = $this->getSqlInfoForMetadataType($metadataType);
            // generate field and value csv string
            $fieldCSVClause = $valueCSVClause = '';
            if(!empty($this->key))
            {
                if(!is_array($this->key))
                {
                    // convert key to array so it can be used w/ below logic
                    $this->key = [ 'fields' => [ $this->key ] ];
                }

                if(isset($this->key['fields']))
                {
                    foreach($this->key['fields'] as $idx => $columnName)
                    {
                        if(!empty($fieldCSVClause))
                        {
                            // not the first column name, prepend a comma
                            $fieldCSVClause .= ',';
                            $valueCSVClause .= ',';
                        }

//                            $fieldCSVClause .= "'".$columnName."'";
                        $fieldCSVClause .= $columnName;
                        $valueCSVClause .= '?';

                        // add value to dataset sent w/ query
                        if(!empty($this->val))
                        {
                            if(is_array($this->val))
                            {
                                if(isset($this->val['values']))
                                {
                                    if(isset($this->val['values'][$idx]))
                                    {
                                        array_push($sqlInputData, $this->val['values'][$idx]);
                                    }
                                    else
                                    {
                                        throw new \Exception('mismatch found between field names and values');
                                    }
                                }
                                else
                                {
                                    throw new \Exception('invalid syntax used with value data');
                                }
                            }
                            else
                            {
                                array_push($sqlInputData, $this->val);
                            }
                        } else
                        {
                            throw new \Exception('no value(s) provided on insert');
                        }
                    }
                }
                else
                {
                    throw new \Exception('invalid syntax used with field name data');
                }
            }
            else
            {
                throw new \Exception('no field names provided on insert');
            }

            $this->dbConn->dbQueryOptions['query'] = "
                  /* Celestial // Tuning.php // Insert New Metadata */
                  INSERT INTO ".$sqlQueryData['tableName']." 
                  (".$fieldCSVClause.")
                  VALUES (".$valueCSVClause.")";
            $this->dbConn->dbQueryOptions['optionVals'] = $sqlInputData;

            $this->resultDataset['data'] = $insertID = $this->dbConn->runQuery('insert');
        }

        return $insertID;
    }

    public function updateInquisitionMetadata()
    {
        /*
         *  Purpose:
         *      * update specified identifier with given data in Inquisition DB
         *
         *  Params: NONE
         *
         *  Returns: BOOL
         *
         */

        $successful = false;

        $metadataType = $this->possibleMetadataVals['types'][$this->metadataTypeIdx];
        $sqlInputData = [];

        // generate sql query
        if($metadataType != 'cfg')
        {
            // not setup for configuration queries, so we're good
            // get table name
            $sqlQueryData = $this->getSqlInfoForMetadataType($metadataType);

            // check if identifier is set
            if(0 < $this->metadataID)
            {
                // assuming user is asking for an update to a record
                array_push($sqlInputData, $this->val);

                // make sure key is valid column name
                $columnNames = $this->dbConn->getColumnNamesOfTable($sqlQueryData['tableName']);
                if(!in_array($this->key, $columnNames))
                {
                    throw new \Exception('key not found as column name in table for given type');
                }
                else
                {
                    $sqlWhereClause = 'WHERE ' . $sqlQueryData['idFieldName'] . ' = ?';
                    array_push($sqlInputData, $this->metadataID);
                }

                $this->dbConn->dbQueryOptions['query'] = "
                      /* Celestial // Tuning.php // Update Current Metadata */
                      UPDATE ".$sqlQueryData['tableName']." 
                      SET ".$this->key." = ?
                      ".$sqlWhereClause."
                      LIMIT 1";
                $this->dbConn->dbQueryOptions['optionVals'] = $sqlInputData;

                $this->resultDataset['data'] = $this->dbConn->runQuery('update');
                $successful = true;
            }
            else
            {
                throw new \Exception('no identifier provided for metadata update');
            }
        }

        return $successful;
    }

    public function deleteInquisitionMetadata()
    {
        /*
         *  Purpose:
         *      * delete specified identifier from Inquisition DB
         *
         *  Params: NONE
         *
         *  Returns: BOOL
         *
         */

        $metadataType = $this->possibleMetadataVals['types'][$this->metadataTypeIdx];

        if($metadataType != 'cfg')
        {
            // not setup for configuration queries, so we're good
            // get table name to query
            $sqlQueryData = $this->getSqlInfoForMetadataType($metadataType);

            // check if identifier is set
            if(0 < $this->metadataID)
            {
                $this->dbConn->dbQueryOptions['query'] = "
                      /* Celestial // Tuning.php // Update Current Metadata */
                      DELETE FROM ".$sqlQueryData['tableName']."
                      WHERE ".$sqlQueryData['idFieldName']." = ?
                      LIMIT 1";
                $this->dbConn->dbQueryOptions['optionVals'] = [ $this->metadataID ];

                $this->resultDataset['data'] = $successful = $this->dbConn->runQuery('delete');
            }
            else
            {
                throw new \Exception('no identifier provided for metadata deletion');
            }
        }
        else
        {
            throw new \Exception('attempting delete on invalid type');
        }

        return $successful;
    }

    // OTHER FUNCTIONS
    public function __toString()
    {
        return json_encode($this->resultDataset);
    }
}