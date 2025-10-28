-- 컨테이너 최초 1회 실행.
CREATE DATABASE IF NOT EXISTS `mongmate`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- 개발용 계정
CREATE USER IF NOT EXISTS 'monguser'@'%' IDENTIFIED BY 'mongpass!123';
GRANT ALL PRIVILEGES ON mongmate.* TO 'monguser'@'%';
FLUSH PRIVILEGES;

-- 타임존 고정
SET time_zone = '+00:00';
