<?php
namespace API;

/**
 *  TuningTest.php - Unit test for Tuning lib
 */

require_once __DIR__.'/../lib/DB.php';
require_once __DIR__.'/../lib/API/Tuning.php';

use PHPUnit\Framework\TestCase;

class TuningTest extends TestCase
{
    public function setUp()
    {
        $this->cfgHandler = new \Config(__DIR__.'/../../build/src/conf/build.cfg');
        $this->tuning = new Tuning($this->cfgHandler);
    }

    // validateJSON will return the decoded JSON if data is in proper JSON format; otherwise, it will return the
    // exact input value sent to it
    public function testValidateJSON_validJSON()
    {
        $JSON = '{"data":[{"key1":"value1"},{"key2":"value2"}]}';
        $deserializedJSON = [
            "data" => [
                [ "key1" => "value1" ],
                [ "key2" => "value2" ]
            ]
        ];

        $this->assertEquals($this->tuning->validateJSON($JSON), $deserializedJSON);
    }

    public function testValidateJSON_invalidJSON()
    {
        $badJSON = '{"invalid":"JSON":"data":[';

        $this->assertEquals($this->tuning->validateJSON($badJSON), $badJSON);
    }

    public function testSetMetadataTypeIdx_validType()
    {
        // the 'all' type is most likely to always be an option
        $metadataType = 'all';

        $this->assertGreaterThanOrEqual(0, $this->tuning->setMetadataTypeIdx($metadataType));
    }

    public function testSetMetadataTypeIdx_typeNotPresent()
    {
        $metadataType = 'invalidMetadataType';

        $this->assertFalse($this->tuning->setMetadataTypeIdx($metadataType));
    }

    public function testSetTuningValues()
    {
        $opts = [
            'section' => 'section name',
            'type' => 'all',
            'id' => 1,
            'key' => 'example_key',
            'val' => 'example_val'
        ];

        $this->tuning->setTuningValues($opts);

        // check that opts were set properly
        $this->assertSame($this->tuning->cfgSection, $opts['section']);
        $this->assertSame($this->tuning->possibleMetadataVals['types'][$this->tuning->metadataTypeIdx], $opts['type']);
        $this->assertSame($this->tuning->metadataID, $opts['id']);
        $this->assertSame($this->tuning->key, $opts['key']);
        $this->assertSame($this->tuning->val, $opts['val']);
    }

    public function testSetTuningValues_shorthandKeys()
    {
        $opts = [
            's' => 'section name',
            't' => 'all',
            'i' => 1,
            'k' => 'example_key',
            'v' => 'example_val'
        ];

        $this->tuning->setTuningValues($opts);

        // check that opts were set properly
        $this->assertSame($this->tuning->cfgSection, $opts['s']);
        $this->assertSame($this->tuning->possibleMetadataVals['types'][$this->tuning->metadataTypeIdx], $opts['t']);
        $this->assertSame($this->tuning->metadataID, $opts['i']);
        $this->assertSame($this->tuning->key, $opts['k']);
        $this->assertSame($this->tuning->val, $opts['v']);
    }

    public function testSetTuningValues_invalidValue()
    {
        $opts = [
            'j' => 'invalid_tuning_val'
        ];

        $this->assertFalse($this->tuning->setTuningValues($opts));
    }

    public function testGetCfgVal()
    {
        $defaultCfgVals = $this->cfgHandler->configVals;

        // update for restricted keys
        $redactedString = '<REDACTED>';
        $defaultCfgVals['debug']['sentry_api_key'] = $redactedString;
        $defaultCfgVals['mysql_database']['db_pass'] = $redactedString;

        $this->assertSame($this->tuning->getCfgVal(), $defaultCfgVals);
    }

    public function testGetCfgVal_allSectionVals_Valid()
    {
        $sectionName = 'log_database';
        $this->tuning->cfgSection = $sectionName;

        $this->assertSame($this->tuning->getCfgVal(), $this->cfgHandler->configVals[$sectionName]);
    }

    public function testGetCfgVal_allSectionVals_Invalid()
    {
        $sectionName = 'nonexistant_section_name';
        $this->tuning->cfgSection = $sectionName;

        $this->assertNull($this->tuning->getCfgVal());
    }

    public function testGetCfgVal_validSectionAndKey()
    {
        $sectionName = 'log_database';
        $keyName = 'host';
        $this->tuning->cfgSection = $sectionName;
        $this->tuning->key = $keyName;

        $this->assertSame($this->tuning->getCfgVal(), $this->cfgHandler->configVals[$sectionName][$keyName]);
    }

    public function testGetCfgVal_validSectionInvalidKey()
    {
        $sectionName = 'log_database';
        $keyName = 'nonexistant_key';
        $this->tuning->cfgSection = $sectionName;
        $this->tuning->key = $keyName;

        $this->assertNull($this->tuning->getCfgVal());
    }

    public function testGetCfgVal_invalidSectionValidKey()
    {
        $sectionName = 'nonexistant_section_name';
        $keyName = 'host';
        $this->tuning->cfgSection = $sectionName;
        $this->tuning->key = $keyName;

        $this->assertNull($this->tuning->getCfgVal());
    }

    public function testGetCfgVal_invalidSectionInvalidKey()
    {
        $sectionName = 'nonexistant_section_name';
        $keyName = 'nonexistant_key';
        $this->tuning->cfgSection = $sectionName;
        $this->tuning->key = $keyName;

        $this->assertNull($this->tuning->getCfgVal());
    }

    public function testGetSqlInfoForMetadataType_validType()
    {
        $metadataType = 'parser';

        $this->assertNotEmpty($this->tuning->getSqlInfoForMetadataType($metadataType)['tableName']);
        $this->assertNotEmpty($this->tuning->getSqlInfoForMetadataType($metadataType)['idFieldName']);
    }

    public function testGetSqlInfoForMetadataType_invalidType()
    {
        $this->expectException(\Exception::class);

        $metadataType = 'nonexistant_type';
        $this->tuning->getSqlInfoForMetadataType($metadataType);
    }
}
