<?php
namespace Perspective;

/**
 *  ViewTest.php - Unit test for View.php lib
 */

require_once __DIR__.'/../lib/Perspective/View.php';

use PHPUnit\Framework\TestCase;

class ViewTest extends TestCase
{
    public function setUp()
    {
        $this->view = new View();
    }

    public function testSanatizeDataForView()
    {
        // checks for the main character escape examples listed in OWASP
        // https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet

        $this->assertEquals(View::sanatizeDataForView('&'), '&amp;');
        $this->assertEquals(View::sanatizeDataForView('<'), '&lt;');
        $this->assertEquals(View::sanatizeDataForView('>'), '&gt;');
        $this->assertEquals(View::sanatizeDataForView('"'), '&quot;');
    }

    public function testGenerateHTML()
    {
        $this->assertNotEmpty($this->view->generateHTML());
    }
}
