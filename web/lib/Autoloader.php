<?php

/**
 *  Autoloader.php - autoloader for classes in this project
 */

// third-party autoloaders
require $_SERVER['DOCUMENT_ROOT'].'/../vendor/predis/predis/autoload.php';
Predis\Autoloader::register();

class Autoloader
{
    public static function loadClass($className)
    {
        $baseUrl = $_SERVER['DOCUMENT_ROOT'];

        // declare third-party libraries that should be excluded
        $thirdPartyLibs = [ 'Predis' ];
        foreach($thirdPartyLibs as $libName)
        {
            if(strpos($className, $libName) !== false)
            {
                return;
            }
        }

        // format full class name as directory structure
        $classDirStructure = str_replace('\\', '/', $className);

        $classFilename = $baseUrl.'/lib/'.$classDirStructure.'.php';
        if(file_exists($classFilename))
        {
            require $classFilename;
        }
        else
        {
            error_log('[ CRIT ] could not load class :: [ '.$classFilename.' ]');
        }
    }
}

// set autoload function in AutoLoad() class
spl_autoload_register(__NAMESPACE__.'\\AutoLoader::loadClass');