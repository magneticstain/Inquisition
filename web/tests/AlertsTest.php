<?php
namespace API;

/**
 *  AlertsTest.php - Unit test for Alerts API lib
 */

// required for Cache dependency
require __DIR__.'/../../vendor/predis/predis/autoload.php';
\Predis\Autoloader::register();

require __DIR__.'/../lib/Cache.php';
require __DIR__.'/../lib/DB.php';
require __DIR__.'/../lib/API/Alerts.php';

use PHPUnit\Framework\TestCase;

class AlertsTest extends TestCase
{
    public function setUp()
    {
        $this->alerts = new Alerts();
    }

    public function testAddSQLQueryConstraints_basicClause()
    {
        $this->alerts->addSQLQueryConstraints('column', 'value');

        $this->assertEquals($this->alerts->alertDBQueryData['whereClause'], 'column = ?');
        $this->assertEquals($this->alerts->alertDBQueryData['vals'], [ 'value' ]);
    }

    public function testAddSQLQueryConstraints_multiClause()
    {
        $this->alerts->addSQLQueryConstraints('column1', 'value1');
        $this->alerts->addSQLQueryConstraints('column2', 2);

        $this->assertEquals($this->alerts->alertDBQueryData['whereClause'], 'column1 = ? AND column2 = ?');
        $this->assertEquals($this->alerts->alertDBQueryData['vals'], [ 'value1', 2 ]);
    }

    public function testAddSQLQueryConstraints_nonDefaultOperator()
    {
        $this->alerts->addSQLQueryConstraints('column1', 'value1');
        $this->alerts->addSQLQueryConstraints('column2', 2, '>=');

        $this->assertEquals($this->alerts->alertDBQueryData['whereClause'], 'column1 = ? AND column2 >= ?');
        $this->assertEquals($this->alerts->alertDBQueryData['vals'], [ 'value1', 2 ]);
    }

    public function testAddSQLQueryConstraints_allowZeroAsVal()
    {
        $this->alerts->alertDBQueryData['whereClause'] = '';
        $this->alerts->addSQLQueryConstraints('column1', 0, '>=');
        $this->assertEmpty($this->alerts->alertDBQueryData['whereClause']);

        $this->alerts->alertDBQueryData['whereClause'] = '';
        $this->alerts->addSQLQueryConstraints('column1', 0, '>=', true);
        $this->assertEquals($this->alerts->alertDBQueryData['whereClause'], 'column1 >= ?');
        $this->assertEquals($this->alerts->alertDBQueryData['vals'], [ 0 ]);
    }
}
