#!/bin/bash
retries=10
while ! mysqladmin ping --silent && [[ $retries -gt 0 ]]; do
  echo "Waiting for MariaDB to be ready..."
  sleep 2
  retries=$((retries-1))
done

if [[ $retries -eq 0 ]]; then
  echo "MariaDB did not start in time. Please check the service logs."
  exit 1
fi

echo "MariaDB is ready. Initializing database..."

mysql -u root -e "CREATE DATABASE IF NOT EXISTS think_then_talk_dev; CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED BY 'devpassword'; GRANT ALL PRIVILEGES ON think_then_talk_dev.* TO 'user'@'localhost'; FLUSH PRIVILEGES;"

echo "Database initialized successfully."
