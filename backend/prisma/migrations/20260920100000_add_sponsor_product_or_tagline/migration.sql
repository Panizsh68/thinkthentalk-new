-- The historical Sponsor table already included productOrTagline, but some
-- deployed schemas were created from an incomplete variant. Add the column
-- forward-only and preserve existing sponsor rows when it is absent.
ALTER TABLE `Sponsor`
    ADD COLUMN IF NOT EXISTS `productOrTagline` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `Sponsor`
    MODIFY COLUMN `productOrTagline` VARCHAR(191) NOT NULL DEFAULT '';
