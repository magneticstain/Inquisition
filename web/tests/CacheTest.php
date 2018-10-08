<?php
/**
 *  CacheTest.php - unit tests for Cache library
 */

require_once __DIR__.'/../lib/Cache.php';

use PHPUnit\Framework\TestCase;

class CacheTest extends TestCase
{
    public function setUp()
    {
        $this->testCache = new Cache();
    }

    public function testGenerateCacheKey_defaultModule()
    {
        $data = [ 'data_val1' ];

        // NOTE: current hash alogrithm is sha256
        $this->assertSame(
            $this->testCache->generateCacheKey($data),
            'cache:any:0a06e7153703348fc1b88c1e38b6eac3645e17fd6127d47911092fbd3cbf7a92');
    }

    public function testGenerateCacheKey_specificModule()
    {
        $data = [ 'data_val1' ];

        $this->assertSame(
            $this->testCache->generateCacheKey($data, 'test_module'),
            'cache:test_module:0a06e7153703348fc1b88c1e38b6eac3645e17fd6127d47911092fbd3cbf7a92');
    }

    public function testGenerateCacheKey_noData()
    {
        $data = '';

        $this->assertSame($data, $this->testCache->generateCacheKey($data));
    }

//    public function testWriteToCache()
//    {
//
//    }
//
//    public function testReadFromCache()
//    {
//
//    }
}
