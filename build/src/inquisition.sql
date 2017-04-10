-- MySQL dump 10.13  Distrib 5.7.17, for Linux (x86_64)
--
-- Host: localhost    Database: inquisition
-- ------------------------------------------------------
-- Server version	5.7.17-0ubuntu0.16.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `FieldTemplateRegex`
--

DROP TABLE IF EXISTS `FieldTemplateRegex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FieldTemplateRegex` (
  `regex_id` int(11) NOT NULL AUTO_INCREMENT,
  `regex` text NOT NULL,
  PRIMARY KEY (`regex_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FieldTemplateRegex`
--

LOCK TABLES `FieldTemplateRegex` WRITE;
/*!40000 ALTER TABLE `FieldTemplateRegex` DISABLE KEYS */;
INSERT INTO `FieldTemplateRegex` VALUES (1,'^[A-Za-z]{3} [0-9 ]{2} [0-9:]{8}');
/*!40000 ALTER TABLE `FieldTemplateRegex` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FieldTemplates`
--

DROP TABLE IF EXISTS `FieldTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FieldTemplates` (
  `template_id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL,
  `field_id` int(11) DEFAULT NULL,
  `regex_id` int(11) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`template_id`),
  KEY `fk_fields` (`field_id`),
  KEY `fk_regex` (`regex_id`),
  CONSTRAINT `fk_fields` FOREIGN KEY (`field_id`) REFERENCES `Fields` (`field_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_regex` FOREIGN KEY (`regex_id`) REFERENCES `FieldTemplateRegex` (`regex_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FieldTemplates`
--

LOCK TABLES `FieldTemplates` WRITE;
/*!40000 ALTER TABLE `FieldTemplates` DISABLE KEYS */;
INSERT INTO `FieldTemplates` VALUES (1,'match_std_linux_syslog_timestamp',1,1,'2017-04-09 19:43:16',1);
/*!40000 ALTER TABLE `FieldTemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Fields`
--

DROP TABLE IF EXISTS `Fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Fields` (
  `field_id` int(11) NOT NULL AUTO_INCREMENT,
  `field_name` varchar(40) NOT NULL,
  PRIMARY KEY (`field_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Fields`
--

LOCK TABLES `Fields` WRITE;
/*!40000 ALTER TABLE `Fields` DISABLE KEYS */;
INSERT INTO `Fields` VALUES (1,'prepended_syslog_timestamp');
/*!40000 ALTER TABLE `Fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ParserToFieldTemplateMapping`
--

DROP TABLE IF EXISTS `ParserToFieldTemplateMapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ParserToFieldTemplateMapping` (
  `mapping_id` int(11) NOT NULL AUTO_INCREMENT,
  `parser_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  PRIMARY KEY (`mapping_id`),
  KEY `fk_parser` (`parser_id`),
  KEY `fk_template` (`template_id`),
  CONSTRAINT `fk_parser` FOREIGN KEY (`parser_id`) REFERENCES `Parsers` (`parser_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_template` FOREIGN KEY (`template_id`) REFERENCES `FieldTemplates` (`template_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParserToFieldTemplateMapping`
--

LOCK TABLES `ParserToFieldTemplateMapping` WRITE;
/*!40000 ALTER TABLE `ParserToFieldTemplateMapping` DISABLE KEYS */;
INSERT INTO `ParserToFieldTemplateMapping` VALUES (1,1,1);
/*!40000 ALTER TABLE `ParserToFieldTemplateMapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Parsers`
--

DROP TABLE IF EXISTS `Parsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Parsers` (
  `parser_id` int(11) NOT NULL AUTO_INCREMENT,
  `parser_name` varchar(100) NOT NULL,
  `parser_log` varchar(100) NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`parser_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Parsers`
--

LOCK TABLES `Parsers` WRITE;
/*!40000 ALTER TABLE `Parsers` DISABLE KEYS */;
INSERT INTO `Parsers` VALUES (1,'syslog_debian','/var/log/syslog','2017-04-09 16:50:41',1);
/*!40000 ALTER TABLE `Parsers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-04-09 20:18:20
