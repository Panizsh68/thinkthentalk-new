ALTER TABLE `TeamMember`
    ADD COLUMN `order` INT NOT NULL DEFAULT 0;

ALTER TABLE `TeamMember`
    ADD INDEX `TeamMember_order_idx`(`order`);

SET @row_number := 0;

UPDATE `TeamMember`
SET `order` = (@row_number := @row_number + 1)
ORDER BY `createdAt` ASC, `id` ASC;
