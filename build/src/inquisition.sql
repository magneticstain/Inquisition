-- MySQL dump 10.13  Distrib 5.7.18, for Linux (x86_64)
--
-- Host: localhost    Database: inquisition
-- ------------------------------------------------------
-- Server version	5.7.18-0ubuntu0.16.04.1

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FieldTemplateRegex`
--

LOCK TABLES `FieldTemplateRegex` WRITE;
/*!40000 ALTER TABLE `FieldTemplateRegex` DISABLE KEYS */;
INSERT INTO `FieldTemplateRegex` VALUES (1,'^[A-Za-z]{3} [0-9 ]{2} [0-9:]{8}'),(2,'^[0-9.]+'),(3,'\\[[\\S]+ -[\\d]+\\]'),(4,'\"[A-Z]{3,6} [\\S]+ [A-Z0-9/\\.]+\" [0-9]{3}'),(5,'([0-9]{3}) (?:[0-9]+) (?:\"http://)'),(6,'\"[a-z]+:\\/\\/[\\S]+\"'),(7,'\"[\\S]+[ .]\\([A-Za-z0-9 ,:;./_-]+\\)([ \\w/]+)?(\\([\\w ,:;./_-]+\\))?([ \\w,:;./_-]+\")?'),(8,'[\\d]{4}-[\\d]{2}-[\\d]{2} [\\d]{2}:[\\d]{2}:[\\d]{2}'),(9,'[\\d]{1,3}\\.[\\d]{1,3}\\.[\\d]{1,3}\\.[\\d]{1,3} [\\d]{3} [A-Z_]+'),(10,'[A-Z]+IED [\\w0-9.]+ -'),(11,'^[\\d]{4}-[\\d]{2}-[\\d]{2}'),(12,'[\\d]{2}:[\\d]{2}:[\\d]{2}'),(13,'[a-z]{1,4},dp=[\\d]{1,5},sp=[\\d]{1,5}');
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
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`template_id`),
  KEY `fk_fields` (`field_id`),
  KEY `fk_regex` (`regex_id`),
  CONSTRAINT `fk_fields` FOREIGN KEY (`field_id`) REFERENCES `Fields` (`field_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_regex` FOREIGN KEY (`regex_id`) REFERENCES `FieldTemplateRegex` (`regex_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FieldTemplates`
--

LOCK TABLES `FieldTemplates` WRITE;
/*!40000 ALTER TABLE `FieldTemplates` DISABLE KEYS */;
INSERT INTO `FieldTemplates` VALUES (1,'match_std_linux_syslog_timestamp',1,1,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(2,'match_fake_apache_src_ip',2,2,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(4,'match_fake_apache_timestamp',1,3,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(5,'match_fake_apache_http_request',3,4,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(6,'match_fake_apache_http_status_code',4,5,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(7,'match_fake_apache_http_referrer',5,6,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(8,'match_http_user_agent',6,7,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(9,'match_fake_bluecoat_timestamp',1,8,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(10,'match_fake_bluecoat_proxy_request',3,9,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(11,'match_fake_bluecoat_action',7,10,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(12,'match_ISO-8601_date',8,11,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(13,'match_ISO-8601_time',9,12,'2017-05-03 19:33:33','2017-05-03 19:33:33',1),(14,'match_fake_dragon_host',10,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(15,'match_fake_dragon_alert_summary',11,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(16,'match_fake_dragon_dst_ip',12,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(17,'match_fake_dragon_src_ip',2,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(18,'match_fake_dragon_dst_port',14,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(19,'match_fake_dragon_src_port',13,NULL,'2017-05-03 19:33:33','2017-05-03 19:33:33',0),(20,'match_fake_dragon_connection_summary',15,13,'2017-05-03 19:33:33','2017-05-03 19:33:33',1);
/*!40000 ALTER TABLE `FieldTemplates` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger FieldTemplates_INSERT before insert on FieldTemplates for each row set new.created = now(), new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger FieldTemplates_UPDATE before update on FieldTemplates for each row set new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `Fields`
--

DROP TABLE IF EXISTS `Fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Fields` (
  `field_id` int(11) NOT NULL AUTO_INCREMENT,
  `field_name` varchar(40) NOT NULL,
  `updated` datetime DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`field_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Fields`
--

LOCK TABLES `Fields` WRITE;
/*!40000 ALTER TABLE `Fields` DISABLE KEYS */;
INSERT INTO `Fields` VALUES (1,'timestamp','2017-05-03 19:31:07','2017-05-03 19:31:07'),(2,'src_ip','2017-05-03 19:31:07','2017-05-03 19:31:07'),(3,'http_request','2017-05-03 19:31:07','2017-05-03 19:31:07'),(4,'http_status_code','2017-05-03 19:31:07','2017-05-03 19:31:07'),(5,'http_referrer','2017-05-03 19:31:07','2017-05-03 19:31:07'),(6,'http_user_agent','2017-05-03 19:31:07','2017-05-03 19:31:07'),(7,'action','2017-05-03 19:31:07','2017-05-03 19:31:07'),(8,'date','2017-05-03 19:31:07','2017-05-03 19:31:07'),(9,'time','2017-05-03 19:31:07','2017-05-03 19:31:07'),(10,'host','2017-05-03 19:31:07','2017-05-03 19:31:07'),(11,'summary','2017-05-03 19:31:07','2017-05-03 19:31:07'),(12,'dst_ip','2017-05-03 19:31:07','2017-05-03 19:31:07'),(13,'src_port','2017-05-03 19:31:07','2017-05-03 19:31:07'),(14,'dst_port','2017-05-03 19:31:07','2017-05-03 19:31:07'),(15,'connection_summary','2017-05-03 19:31:07','2017-05-03 19:31:07');
/*!40000 ALTER TABLE `Fields` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger Fields_INSERT before insert on Fields for each row set new.created = now(), new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger Fields_UPDATE before update on Fields for each row set new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParserToFieldTemplateMapping`
--

LOCK TABLES `ParserToFieldTemplateMapping` WRITE;
/*!40000 ALTER TABLE `ParserToFieldTemplateMapping` DISABLE KEYS */;
INSERT INTO `ParserToFieldTemplateMapping` VALUES (1,1,1),(3,2,2),(4,2,4),(5,2,5),(6,2,6),(7,2,7),(8,2,8),(9,3,9),(10,3,8),(11,3,10),(12,3,11),(13,4,12),(14,4,13),(15,4,20);
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
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`parser_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Parsers`
--

LOCK TABLES `Parsers` WRITE;
/*!40000 ALTER TABLE `Parsers` DISABLE KEYS */;
INSERT INTO `Parsers` VALUES (1,'kernel_log','/var/log/kern.log','2017-05-03 19:30:00','2017-05-03 19:30:00',0),(2,'fake_apache_logs','/var/log/inquisition/test_logs/apache_access.log','2017-05-03 19:30:00','2017-05-04 17:42:51',1),(3,'fake_bluecoat_logs','/var/log/inquisition/test_logs/bluecoat.log','2017-05-03 19:30:00','2017-05-04 17:43:08',1),(4,'fake_dragon_ids_alert_logs','/var/log/inquisition/test_logs/dragon_alerts.log','2017-05-03 19:30:00','2017-05-04 17:43:22',1);
/*!40000 ALTER TABLE `Parsers` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger Parsers_INSERT before insert on Parsers for each row set new.created = now(), new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 trigger Parsers_UPDATE before update on Parsers for each row set new.updated = now() */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-05-04 17:44:50
