export const CAMPAIGN_TIMEZONE_PRESETS = [
  { label: 'IST - India Standard Time', value: 'Asia/Kolkata', hours: '09:00-18:00' },
  { label: 'EST - Eastern Standard Time', value: 'America/New_York', hours: '09:00-17:00' },
  { label: 'PST - Pacific Standard Time', value: 'America/Los_Angeles', hours: '09:00-17:00' },
  { label: 'CST - Central Standard Time', value: 'America/Chicago', hours: '09:00-17:00' },
  { label: 'MST - Mountain Standard Time', value: 'America/Denver', hours: '09:00-17:00' },
  { label: 'GMT - Greenwich Mean Time', value: 'Etc/GMT', hours: '09:00-17:00' },
  { label: 'CET - Central European Time', value: 'Europe/Paris', hours: '09:00-18:00' },
  { label: 'SGT - Singapore Time', value: 'Asia/Singapore', hours: '09:00-18:00' },
  { label: 'AEST - Australian Eastern Time', value: 'Australia/Sydney', hours: '09:00-17:00' },
  { label: 'Custom timezone', value: '__custom__', hours: '' },
] as const
