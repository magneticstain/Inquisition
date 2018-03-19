<?php
namespace API;

/**
 *  API/Stats.php - class for all logic related to Inquisition statistics
 */

use Predis\Collection\Iterator;

class Stats
{
    public $inquisitionDbConn = null;
    public $statsDbConn = null;

    public function __construct($inquisitionDbConn = null, $statsDbConn = null, $statsDbServer = null, $statsDbPort = null)
    {
        if(is_null($inquisitionDbConn))
        {
            // no db handler provided; try creating one w/ default options
            try
            {
                $this->dbConn = new \DB();
            }
            catch(\Exception $e)
            {
                throw new \Exception('could not start db connection for stats :: [ MSG: '.$e->getMessage().' ]');
            }
        }
        else
        {
            $this->dbConn = $inquisitionDbConn;
        }

        if(is_null($statsDbConn))
        {
            try
            {
                $this->statsDbConn = \Cache::generateRedisConn($statsDbServer, $statsDbPort);
            }
            catch(\Exception $e)
            {
                throw new \Exception('[ SEV: ERROR ] could not connect to stats db :: [ MSG: '.$e->getMessage().' ]');
            }
        }
        else
        {
            $this->statsDbConn = $statsDbConn;
        }
    }

    public function getStats($statType = null, $statKey = null, $statName = null)
    {
        /*
         *  Purpose:
         *      * get stats with given parameters
         *
         *  Params:
         *      * $statType :: STR :: type of stat to retrieve
         *      * $statKey :: STR :: key for stat hash
         *      * $statName :: STR :: name of specific stat to fetch
         *
         *  Returns: ARRAY
         *
         * Addl. Info:
         *      * https://labs.omniti.com/labs/jsend
         *
         */

        // initialize base db key for stats, including common key strings, etc
        $baseStatKey = 'stats';

        // API response format framework: https://labs.omniti.com/labs/jsend
        $statDataset = [
            'status' => 'success',
            'data_source' => 'default',
            'data' => []
        ];

        // get records for specified types
        if(!is_null($statType))
        {
            // search for records with given key pattern
            // see: https://stackoverflow.com/a/28545550/2625915
            foreach(new Iterator\Keyspace($this->statsDbConn, $baseStatKey.':'.$statType.':*') as $hashKey)
            {
                $statDataset['data'][$hashKey] = $this->statsDbConn->hgetall($hashKey);
            }
        }

        // check key
        if(!is_null($statKey))
        {
            if(!empty($statDataset['data']))
            {
                // check to see if key exists in current set
                if(array_key_exists($statKey, $statDataset['data']))
                {
                    // narrow down results
                    $statDataset['data'] = [
                        $statKey => $statDataset['data'][$statKey]
                    ];
                }
                else
                {
                    // no records found
                    $statDataset['data'] = [];
                }
            }
            else
            {
                // check if we can find the key in the database
                $statDataset['data'] = [
                    $statKey => $this->statsDbConn->hgetall($statKey)
                ];
            }
        }

        // check name
        if(!is_null($statName))
        {
            $localDataset = [];

            if(!empty($statDataset['data']))
            {
                foreach($statDataset['data'] as $recordKey => $recordVal)
                {
                    if($recordKey === $statName)
                    {
                        // there was only a single record and we found the val
                        $localDataset[$recordKey] = [
                            $statName => $recordVal
                        ];

                        break;
                    }
                    elseif(is_array($recordVal))
                    {
                        // check record val to see if it has the value and append it to results
                        if(array_key_exists($statName, $recordVal))
                        {
                            $localDataset[$recordKey] = [
                                $statName => $recordVal[$statName]
                            ];
                        }
                    }
                }
            }
            elseif(is_null($statType) && is_null($statKey))
            {
                // we only want to try this when we have no records yet AND we've haven't tried to fetch any yet
                // if we have tried to fetch some, we don't want to widen the search anymore by searching the db

                // check if we can find the name as a key in any records in the database
                // get all stat records from db
                foreach(new Iterator\Keyspace($this->statsDbConn, $baseStatKey.':*') as $hashKey)
                {
                    $record = $this->statsDbConn->hgetall($hashKey);

                    if(array_key_exists($statName, $record))
                    {
                        // found a val match
                        $localDataset[$hashKey] = [
                            $statName => $record[$statName]
                        ];
                    }
                }
            }

            $statDataset['data'] = $localDataset;
        }

        return $statDataset;
    }
}