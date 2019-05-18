<?php

/**
 *  Cache.php - library for caching-related logic
 */

class Cache
{
    public $cachingServerConn = null;
    public $cacheKeyHashAlgo = 'sha256';
    private $cacheTimeout = 0;

    public function __construct($cacheTimeout = 300, $cachingServerConn = null,
                                $cachingServerHost = '127.0.0.1', $cachingServerPort = 6379)
    {
        if(!is_null($cachingServerConn))
        {
            $this->cachingServerConn = $cachingServerConn;
        }
        else
        {
            // predis project repo: https://github.com/nrk/predis
            $this->cachingServerConn = Cache::generateRedisConn($cachingServerHost, $cachingServerPort);
        }

        $this->setCacheTimeout($cacheTimeout);
    }

    private function setCacheTimeout($cacheTimeout)
    {
        /*
         *  Purpose:
         *      * set the timout - in sconds - that given data should be cached for
         *
         *  Params:
         *      * $cacheTimeout :: INT :: timeout value
         *
         *  Returns: Bool
         */

        if($cacheTimeout < 0)
        {
            throw new \Exception('invalid cache timeout provided');
        }

        $this->cacheTimeout = $cacheTimeout;

        return true;
    }

    public static function generateRedisConn($redisServerHost = '127.0.0.1', $redisServerPort = 6379)
    {
        /*
         *  Purpose:
         *      * generate a connection to a Redis database
         *
         *  Params:
         *      * $redisServerHost :: STR :: IP or hostname of redis db server
         *      * $redisServerPort :: INT :: port to connect to Redis server on
         *
         *  Returns: Predis obj
         *
         */
        $cacheDBConn = new Predis\Client([
            'scheme' => 'tcp',
            'host' => $redisServerHost,
            'port' => $redisServerPort
        ]);

        // Fixes Issue #111
        //
        // predis uses lazy connecting, so any connection-related exceptions don't get raised until an action is taken
        // this logic forces it to try to connect
        //
        // https://github.com/nrk/predis/issues/223
        $cacheDBConn->connect();

        return $cacheDBConn;
    }

    public function generateCacheKey($queryData, $srcModule = 'any')
    {
        /*
         *  Purpose:
         *      * generate a hash value for given SQL query with given params being used with it
         *      * use that hash as part of the generated cache key
         *
         *  Params:
         *      * $queryData :: ARRAY :: all data related to a query, normally including the query and data sent w/ it
         *      * $srcModule :: STR :: name of module that is generating the cache key; makes outside ID easier
         *
         *  Returns: STR
         *
         */

        if(empty($queryData))
        {
            return '';
        }

        // combine query and params to get message used for calculating hash
        $message = json_encode($queryData);

        return 'cache:'.$srcModule.':'.hash($this->cacheKeyHashAlgo, $message);
    }

    public function readFromCache($cacheKey)
    {
        /*
         *  Purpose: read data with given key from cache db
         *
         *  Params:
         *      * $cacheKey :: STR :: database key to search cache db for
         *
         *  Returns: ARRAY
         *
         */

        if(!$this->cachingServerConn->exists($cacheKey))
        {
            return '';
        }

        return json_decode($this->cachingServerConn->get($cacheKey));
    }

    public function writeToCache($cacheKey, $cacheVal)
    {
        /*
         *  Purpose: write data to cache using given key
         *
         *  Params:
         *      * $cacheKey :: STR :: database key to use for cache db
         *      * $cacheVal :: ARRAY :: dataset to save in cache
         *
         *  Returns: BOOL
         *
         */

        if(empty($cacheKey))
        {
            error_log('[ WARN ] missing key provided for cache writing :: [ KEY: '.$cacheKey.' || VALUE: '
                .json_encode($cacheVal).' ]');

            return false;
        }

        // serialize cache val data and write to db
        $this->cachingServerConn->set($cacheKey, json_encode($cacheVal));

        // set cache timeout for entry, if needed
        if(0 < $this->cacheTimeout)
        {
            $this->cachingServerConn->expire($cacheKey, $this->cacheTimeout);
        }

        return true;
    }
}