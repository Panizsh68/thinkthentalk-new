CREATE DATABASE IF NOT EXISTS think_then_talk_dev;
CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED BY 'devpassword';
GRANT ALL PRIVILEGES ON think_then_talk_dev.* TO 'user'@'localhost';
FLUSH PRIVILEGES;