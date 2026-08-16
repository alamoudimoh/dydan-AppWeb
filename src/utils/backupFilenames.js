export const DEFAULT_BACKUP_FILENAME_PREFIX = 'daydan-backup'

export const buildDefaultBackupFilename = timestamp =>
  `${DEFAULT_BACKUP_FILENAME_PREFIX}-${timestamp}.backup`
