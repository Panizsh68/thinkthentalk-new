-- This migration repairs the incomplete historical migration chain without
-- changing any already-applied migration. It intentionally leaves
-- CollaborationRequest.acceptedTerms and TeamMember.order to the following
-- historical migrations, so a fresh database can run the chain in order.

CREATE TABLE IF NOT EXISTS `CollaborationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `fieldOfExpertise` VARCHAR(191) NOT NULL,
    `experience` TEXT NULL,
    `whyJoin` TEXT NOT NULL,
    `availability` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'CONTACTED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `CollaborationRequest_userId_fkey`(`userId`),
    INDEX `CollaborationRequest_status_idx`(`status`),
    INDEX `CollaborationRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `CollaborationRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SponsorshipRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `representativeName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `plan` ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'CONTACTED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `SponsorshipRequest_userId_fkey`(`userId`),
    INDEX `SponsorshipRequest_status_idx`(`status`),
    INDEX `SponsorshipRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `SponsorshipRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- These content tables were created by an earlier schema snapshot in the
-- deployed application. Create the canonical shape when a database does not
-- have them yet, while preserving the legacy-column reconciliation below.
CREATE TABLE IF NOT EXISTS `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `firstNameFa` VARCHAR(191) NOT NULL,
    `lastNameFa` VARCHAR(191) NOT NULL,
    `roleFa` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Sponsor` (
    `id` VARCHAR(191) NOT NULL,
    `nameFa` VARCHAR(191) NOT NULL,
    `productOrTagline` VARCHAR(191) NOT NULL DEFAULT '',
    `logoUrl` VARCHAR(191) NOT NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- TeamMember was created historically with name/role/photoUrl. Rename those
-- fields only when the old shape is present, keeping already-repaired
-- production databases safe.
SET @team_member_rename_name = (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'name')
        AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'firstNameFa'),
        'ALTER TABLE `TeamMember` CHANGE COLUMN `name` `firstNameFa` VARCHAR(191) NOT NULL',
        'SELECT 1'
    )
);
PREPARE team_member_rename_name_stmt FROM @team_member_rename_name;
EXECUTE team_member_rename_name_stmt;
DEALLOCATE PREPARE team_member_rename_name_stmt;

SET @team_member_rename_role = (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'role')
        AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'roleFa'),
        'ALTER TABLE `TeamMember` CHANGE COLUMN `role` `roleFa` VARCHAR(191) NOT NULL',
        'SELECT 1'
    )
);
PREPARE team_member_rename_role_stmt FROM @team_member_rename_role;
EXECUTE team_member_rename_role_stmt;
DEALLOCATE PREPARE team_member_rename_role_stmt;

SET @team_member_rename_photo = (
    SELECT IF(
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'photoUrl')
        AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember' AND column_name = 'avatarUrl'),
        'ALTER TABLE `TeamMember` CHANGE COLUMN `photoUrl` `avatarUrl` VARCHAR(191) NULL',
        'SELECT 1'
    )
);
PREPARE team_member_rename_photo_stmt FROM @team_member_rename_photo;
EXECUTE team_member_rename_photo_stmt;
DEALLOCATE PREPARE team_member_rename_photo_stmt;

ALTER TABLE `TeamMember`
    ADD COLUMN IF NOT EXISTS `lastNameFa` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS `isActive` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `TeamMember`
    MODIFY COLUMN `lastNameFa` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `CollaborationRequest`
    ADD COLUMN IF NOT EXISTS `acceptedTermsAt` DATETIME(3) NULL,
    ADD INDEX IF NOT EXISTS `CollaborationRequest_status_idx`(`status`),
    ADD INDEX IF NOT EXISTS `CollaborationRequest_createdAt_idx`(`createdAt`);

ALTER TABLE `SponsorshipRequest`
    ADD INDEX IF NOT EXISTS `SponsorshipRequest_status_idx`(`status`),
    ADD INDEX IF NOT EXISTS `SponsorshipRequest_createdAt_idx`(`createdAt`);

CREATE TABLE IF NOT EXISTS `CollaborationRequestStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `collaborationRequestId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('PENDING', 'REVIEWING', 'CONTACTED', 'ACCEPTED', 'REJECTED') NULL,
    `toStatus` ENUM('PENDING', 'REVIEWING', 'CONTACTED', 'ACCEPTED', 'REJECTED') NOT NULL,
    `note` TEXT NULL,
    `changedByAdminId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `CollaborationRequestStatusHistory_collaborationRequestId_cre_idx`(`collaborationRequestId`, `createdAt`),
    INDEX `CollaborationRequestStatusHistory_changedByAdminId_idx`(`changedByAdminId`),
    INDEX `CollaborationRequestStatusHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `CollaborationRequestStatusHistory_collaborationRequestId_fkey` FOREIGN KEY (`collaborationRequestId`) REFERENCES `CollaborationRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `CollaborationRequestStatusHistory_changedByAdminId_fkey` FOREIGN KEY (`changedByAdminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The historical Event migration added a nullable slug but omitted the
-- unique constraint required by the current Prisma schema. Existing rows
-- without a slug receive a deterministic, unique fallback before the column
-- is made required.
SET @event_slug_column = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'Event')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Event' AND column_name = 'slug'),
    'ALTER TABLE `Event` ADD COLUMN `slug` VARCHAR(191) NULL',
    'SELECT 1'
);
PREPARE event_slug_column_stmt FROM @event_slug_column;
EXECUTE event_slug_column_stmt;
DEALLOCATE PREPARE event_slug_column_stmt;

UPDATE `Event`
SET `slug` = CONCAT('event-', `id`)
WHERE `slug` IS NULL OR TRIM(`slug`) = '';

ALTER TABLE `Event`
    MODIFY COLUMN `slug` VARCHAR(191) NOT NULL;

SET @event_slug_unique = IF(
    NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Event' AND index_name = 'Event_slug_key'),
    'ALTER TABLE `Event` ADD UNIQUE INDEX `Event_slug_key`(`slug`)',
    'SELECT 1'
);
PREPARE event_slug_unique_stmt FROM @event_slug_unique;
EXECUTE event_slug_unique_stmt;
DEALLOCATE PREPARE event_slug_unique_stmt;

-- Sponsor was created by the historical migration with the old `name`
-- column. Rename it to the current schema name without discarding any data.
SET @sponsor_name = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Sponsor' AND column_name = 'name')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Sponsor' AND column_name = 'nameFa'),
    'ALTER TABLE `Sponsor` CHANGE COLUMN `name` `nameFa` VARCHAR(191) NOT NULL',
    'SELECT 1'
);
PREPARE sponsor_name_stmt FROM @sponsor_name;
EXECUTE sponsor_name_stmt;
DEALLOCATE PREPARE sponsor_name_stmt;
