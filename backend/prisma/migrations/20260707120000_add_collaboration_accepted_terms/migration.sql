ALTER TABLE `CollaborationRequest`
    ADD COLUMN IF NOT EXISTS `acceptedTerms` BOOLEAN NOT NULL DEFAULT false;
