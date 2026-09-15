export const DEFAULT_BACKUP_FILENAME_PREFIX = 'dydan-backup'

export const buildDefaultBackupFilename = timestamp =>
  `${DEFAULT_BACKUP_FILENAME_PREFIX}-${timestamp}.backup`
