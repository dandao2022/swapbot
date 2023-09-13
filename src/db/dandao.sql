/*
 Navicat Premium Data Transfer

 Source Server         : dandaomysql
 Source Server Type    : MySQL
 Source Server Version : 80029
 Source Host           : localhost:3306
 Source Schema         : dandao

 Target Server Type    : MySQL
 Target Server Version : 80029
 File Encoding         : 65001

 Date: 31/08/2023 14:29:17
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for analyzedata
-- ----------------------------
DROP TABLE IF EXISTS `analyzedata`;
CREATE TABLE `analyzedata`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `holders` int NULL DEFAULT 0,
  `top_holder` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `count` int NULL DEFAULT 0,
  `price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `buy_list` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `sell_list` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `buy_amount` decimal(10, 5) NULL DEFAULT NULL,
  `sell_amount` decimal(10, 5) NULL DEFAULT NULL,
  `smart_money` int NULL DEFAULT 0,
  `inflow` decimal(10, 5) NULL DEFAULT NULL,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `address`(`address` ASC) USING BTREE,
  INDEX `createTime`(`create_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16007 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for contract
-- ----------------------------
DROP TABLE IF EXISTS `contract`;
CREATE TABLE `contract`  (
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `chain_id` int NULL DEFAULT 0,
  `block_number` int NULL DEFAULT 0,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `symbol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `total_supply` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `decimals` int NULL DEFAULT 0,
  `owner` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_add_liquidity` tinyint NULL DEFAULT 0,
  `is_remove_liquidity` tinyint NULL DEFAULT 0,
  `is_check_price` tinyint NULL DEFAULT 0,
  `pools` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `liquidity_pools` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `reserve0` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `first_price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `first_pool_balance` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `liquidity_total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_get_swap_fee` tinyint NULL DEFAULT 0,
  `buy_fee` int NULL DEFAULT 0,
  `sell_fee` int NULL DEFAULT 0,
  `creator` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `update_time` int NULL DEFAULT 0,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`address`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for event
-- ----------------------------
DROP TABLE IF EXISTS `event`;
CREATE TABLE `event`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hash` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `chain_id` int NULL DEFAULT 0,
  `from_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `to_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_swap_fee` int NULL DEFAULT 0,
  `swap_out_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_swap_fee` int NULL DEFAULT 0,
  `swap_in_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `swap_routers` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `effective_gas_price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `gas_used` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `block_number` int NULL DEFAULT 0,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `swapOutAddress`(`swap_out_address` ASC) USING BTREE,
  INDEX `swapInAddress`(`swap_in_address` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 244538 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for setting
-- ----------------------------
DROP TABLE IF EXISTS `setting`;
CREATE TABLE `setting`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `telegram_id` int NULL DEFAULT NULL,
  `chain_id` int NULL DEFAULT 0,
  `manual_gas_fee` int NULL DEFAULT 0,
  `follow_gas_fee` int NULL DEFAULT 0,
  `rush_gas_fee` int NULL DEFAULT 0,
  `rush_time` int NULL DEFAULT 0,
  `sell_percent` int NULL DEFAULT 0,
  `follow_swap_fee` int NULL DEFAULT 0,
  `manual_swap_fee` int NULL DEFAULT 0,
  `reaction_id` int NULL DEFAULT 0,
  `reaction_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `default_address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `default_private_key` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `set_type` tinyint NULL DEFAULT 0,
  `log_id` int NULL DEFAULT 0,
  `amount` decimal(10, 5) NULL DEFAULT 0.00000,
  `follow_amount` decimal(10, 5) NULL DEFAULT 0.00000,
  `query` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `rush_amount` decimal(10, 5) NULL DEFAULT 0.00000,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smartmoney
-- ----------------------------
DROP TABLE IF EXISTS `smartmoney`;
CREATE TABLE `smartmoney`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smartmoneyaddress
-- ----------------------------
DROP TABLE IF EXISTS `smartmoneyaddress`;
CREATE TABLE `smartmoneyaddress`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `count` int NULL DEFAULT 0,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 841 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for task
-- ----------------------------
DROP TABLE IF EXISTS `task`;
CREATE TABLE `task`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `private_key` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telegram_id` int NULL DEFAULT 0,
  `telegram_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `percent` int NULL DEFAULT 0,
  `pool_percent` int NULL DEFAULT 0,
  `type` tinyint NULL DEFAULT 0,
  `encode_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `send_gas_fee` int NULL DEFAULT 0,
  `swap_fee` int NULL DEFAULT 0,
  `gas_fee` int NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 0,
  `start_time` int NULL DEFAULT 0,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for transferlog
-- ----------------------------
DROP TABLE IF EXISTS `transferlog`;
CREATE TABLE `transferlog`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hash` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telegram_id` int NULL DEFAULT 0,
  `telegram_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `type` tinyint NULL DEFAULT 0,
  `status` tinyint NULL DEFAULT 0,
  `transfer_type` tinyint NULL DEFAULT 0,
  `is_sell` tinyint NULL DEFAULT 0,
  `symbol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cost` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '0.00000',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 70 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for wallet
-- ----------------------------
DROP TABLE IF EXISTS `wallet`;
CREATE TABLE `wallet`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `private_key` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telegram_id` int NULL DEFAULT 0,
  `telegram_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for watch
-- ----------------------------
DROP TABLE IF EXISTS `watch`;
CREATE TABLE `watch`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telegram_id` int NULL DEFAULT 0,
  `telegram_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `follow_buy` tinyint NULL DEFAULT 0,
  `follow_sell` tinyint NULL DEFAULT 0,
  `follow_amount` decimal(10, 5) NULL DEFAULT NULL,
  `follow_gas_fee` int NULL DEFAULT 0,
  `follow_swap_fee` int NULL DEFAULT 0,
  `follow_private_key` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for watchlog
-- ----------------------------
DROP TABLE IF EXISTS `watchlog`;
CREATE TABLE `watchlog`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `hash` varchar(66) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `chain_id` int NULL DEFAULT 0,
  `address` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_all_reserve` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_pool` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_decimals` int NULL DEFAULT 0,
  `in_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `in_symbol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_target` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_all_reserve` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_pool` varchar(42) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_decimals` int NULL DEFAULT 0,
  `out_version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `out_symbol` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `telegram_id` int NULL DEFAULT 0,
  `telegram_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `price` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `amount_in` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `amount_out` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `swap_fee` int NULL DEFAULT 0,
  `left_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cost` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `type` tinyint NULL DEFAULT 0,
  `create_time` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
