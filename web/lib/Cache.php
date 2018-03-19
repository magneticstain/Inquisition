<?php

/**
 *  Cache.php - library for caching-related logic
 */

require $_SERVER['DOCUMENT_ROOT'].'/../vendor/predis/predis/autoload.php';
Predis\Autoloader::register();

class Cache
{
    public $cachingServerConn = null;
    public $cacheKeyHashAlgo = 'sha256';

    public function __construct($cachingServerConn = null, $cachingServerHost = '127.0.0.1', $cachingServerPort = 6379)
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

        return new Predis\Client([
            'scheme' => 'tcp',
            'host' => $redisServerHost,
            'port' => $redisServerPort
        ]);
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

    public function writeToCache($cacheKey, $cacheVal, $timeout = 300)
    {
        /*
         *  Purpose: write data to cache using given key
         *
         *  Params:
         *      * $cacheKey :: STR :: database key to use for cache db
         *      * $cacheVal :: ARRAY :: dataset to save in cache
         *      * $timeout :: INT :: number of seconds to keep results in cache; "freshness" setting
         *
         *  Returns: BOOL
         *
         */

        if(empty($cacheKey) || empty($cacheVal))
        {
            error_log('[ WARN ] missing data provided for cache writing :: [ KEY: '.$cacheKey.' || VALUE: '
                .json_encode($cacheVal).' ]');

            return false;
        }

        // serial cache val data
        $serializedCacheVal = json_encode($cacheVal);

        // write data to db
        $this->cachingServerConn->set($cacheKey, $serializedCacheVal);

        // set timeout if appl.
        $timeout = (int)$timeout;
        if(0 < $timeout)
        {
            $this->cachingServerConn->expire($cacheKey, $timeout);
        }

        return true;
    }
}