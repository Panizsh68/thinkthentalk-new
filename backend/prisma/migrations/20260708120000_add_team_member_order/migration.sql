-- Production already contains this column because it was added manually before
-- this migration was recorded. Only backfill values when this migration really
-- creates the column; never overwrite an existing administrator-defined order.
SET @team_member_order_exists := (
    SELECT COUNT(*) > 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'TeamMember'
      AND COLUMN_NAME = 'order'
);

SET @team_member_order_add_sql := IF(
    @team_member_order_exists,
    'SELECT 1',
    'ALTER TABLE `TeamMember` ADD COLUMN `order` INT NOT NULL DEFAULT 0'
);

PREPARE team_member_order_add_stmt FROM @team_member_order_add_sql;
EXECUTE team_member_order_add_stmt;
DEALLOCATE PREPARE team_member_order_add_stmt;

ALTER TABLE `TeamMember`
    ADD INDEX IF NOT EXISTS `TeamMember_order_idx`(`order`);

SET @row_number := 0;

SET @team_member_order_backfill_sql := IF(
    @team_member_order_exists,
    'SELECT 1',
    'UPDATE `TeamMember` SET `order` = (@row_number := @row_number + 1) ORDER BY `createdAt` ASC, `id` ASC'
);

PREPARE team_member_order_backfill_stmt FROM @team_member_order_backfill_sql;
EXECUTE team_member_order_backfill_stmt;
DEALLOCATE PREPARE team_member_order_backfill_stmt;
