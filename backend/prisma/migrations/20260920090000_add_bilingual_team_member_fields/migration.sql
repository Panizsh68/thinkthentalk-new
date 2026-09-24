-- Add the English TeamMember fields without fabricating translations for
-- existing records. The application falls back to the preserved Persian
-- values until an administrator supplies English content.
ALTER TABLE `TeamMember`
    ADD COLUMN IF NOT EXISTS `firstNameEn` VARCHAR(191) NULL,
    ADD COLUMN IF NOT EXISTS `lastNameEn` VARCHAR(191) NULL,
    ADD COLUMN IF NOT EXISTS `roleEn` VARCHAR(191) NULL;

-- Keep the historical `order` column and its data. Prisma exposes it as the
-- canonical `displayOrder` field through @map("order").
ALTER TABLE `TeamMember`
    ADD INDEX IF NOT EXISTS `TeamMember_order_idx`(`order`);
