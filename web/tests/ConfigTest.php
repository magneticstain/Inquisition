<?php

/**
 *  ConfigTest.php - Unit test for Config lib
 */

require_once __DIR__.'/../lib/Config.php';

use PHPUnit\Framework\TestCase;

class ConfigTest extends TestCase
{
    public function setUp()
    {
        $this->configSet = new Config(__DIR__.'/../../build/src/conf/build.cfg');
    }

    public function testReadConfigFile_validFile()
    {
        $this->assertTrue($this->configSet->readConfigFile(__DIR__.'/../../build/src/conf/build.cfg'));
    }

    public function testReadConfigFile_invalidFile()
    {
        $this->assertFalse($this->configSet->readConfigFile(__DIR__.'/../../build/src/conf/nonexistent-read.cfg'));
    }

    public function testUpdateConfigFile_validFile()
    {

    }

    public function testUpdateConfigFile_invalidFile()
    {
        $this->assertFalse($this->configSet->updateConfigFile(
            'set',
            __DIR__.'/../../build/src/conf/nonexistent-update.cfg',
            '',
            '',
            ''
        ));
    }
}
