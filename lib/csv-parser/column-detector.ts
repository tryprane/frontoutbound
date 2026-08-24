export type PredefinedVariable =
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'companyName'
  | 'jobTitle'
  | 'personalization'
  | 'phone'
  | 'website'
  | 'location'
  | 'linkedin'

export type ColumnMappingType = 'predefined' | 'custom' | 'ignore'

export interface ColumnMappingEntry {
  type: ColumnMappingType
  field?: PredefinedVariable
  variableName?: string
}

export interface ColumnMapping {
  [csvHeader: string]: ColumnMappingEntry
}

export const PREDEFINED_VARIABLE_LABELS: Record<PredefinedVariable, string> = {
  email: 'Email',
  firstName: 'First Name',
  lastName: 'Last Name',
  companyName: 'Company Name',
  jobTitle: 'Job Title',
  personalization: 'Personalization',
  phone: 'Phone',
  website: 'Website',
  location: 'Location',
  linkedin: 'LinkedIn',
}

export const PREDEFINED_VARIABLE_TOKENS: Record<PredefinedVariable, string> = {
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  companyName: 'companyName',
  jobTitle: 'jobTitle',
  personalization: 'Personalization',
  phone: 'phone',
  website: 'website',
  location: 'location',
  linkedin: 'linkedin',
}

const COMPANY_KEYWORDS = ['agency', 'company', 'business', 'brand', 'firm', 'org', 'organization', 'client', 'account']
const FIRST_NAME_KEYWORDS = ['first_name', 'firstname', 'first']
const LAST_NAME_KEYWORDS = ['last_name', 'lastname', 'last']
const JOB_TITLE_KEYWORDS = ['jobtitle', 'job_title', 'designation', 'position', 'title', 'role']
const WEBSITE_KEYWORDS = ['website', 'url', 'domain', 'site', 'web', 'link', 'homepage']
const EMAIL_KEYWORDS = ['email', 'mail', 'e-mail', 'workemail', 'businessemail']
const PHONE_KEYWORDS = ['phone', 'mobile', 'whatsapp', 'wa', 'tel', 'telephone', 'number', 'contactnumber', 'cell']
const LOCATION_KEYWORDS = ['location', 'city', 'state', 'country', 'region', 'geo']
const LINKEDIN_KEYWORDS = ['linkedin', 'linkedinurl', 'linkedinprofile']
const PERSONALIZATION_KEYWORDS = ['personalization', 'personalised', 'personalized', 'openingline', 'line', 'icebreaker']

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const URL_REGEX = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/
const PHONE_REGEX = /(\+?\d[\d\s\-().]{7,20}\d)/
const LINKEDIN_REGEX = /linkedin\.com/i
const PREDEFINED_FIELDS = new Set<PredefinedVariable>([
  'email',
  'firstName',
  'lastName',
  'companyName',
  'jobTitle',
  'personalization',
  'phone',
  'website',
  'location',
  'linkedin',
])

export interface TemplateVariableOption {
  key: string
  label: string
  type: 'predefined' | 'custom'
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[\s_\-./]/g, '')
}

export function sanitizeVariableName(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

function matchesKeywords(header: string, keywords: string[]): boolean {
  const normalized = normalize(header)
  return keywords.some((keyword) => normalized.includes(normalize(keyword)))
}

function buildPredefinedEntry(field: PredefinedVariable): ColumnMappingEntry {
  return { type: 'predefined', field }
}

function buildCustomEntry(header: string): ColumnMappingEntry {
  return {
    type: 'custom',
    variableName: sanitizeVariableName(header),
  }
}

function normalizeMappingEntry(header: string, rawEntry: unknown): ColumnMappingEntry {
  if (rawEntry && typeof rawEntry === 'object' && 'type' in (rawEntry as Record<string, unknown>)) {
    const entry = rawEntry as Record<string, unknown>
    const type = entry.type === 'predefined' || entry.type === 'custom' || entry.type === 'ignore'
      ? entry.type
      : 'ignore'
    const field = typeof entry.field === 'string' && PREDEFINED_FIELDS.has(entry.field as PredefinedVariable)
      ? (entry.field as PredefinedVariable)
      : undefined

    if (type === 'predefined' && field) {
      return buildPredefinedEntry(field)
    }

    if (type === 'custom') {
      return {
        type: 'custom',
        variableName: typeof entry.variableName === 'string'
          ? sanitizeVariableName(entry.variableName)
          : sanitizeVariableName(header),
      }
    }

    return { type: 'ignore' }
  }

  if (typeof rawEntry === 'string') {
    if (rawEntry === 'ignore') {
      return { type: 'ignore' }
    }

    const legacyField = rawEntry === 'name' ? 'companyName' : rawEntry
    if (PREDEFINED_FIELDS.has(legacyField as PredefinedVariable)) {
      return buildPredefinedEntry(legacyField as PredefinedVariable)
    }
  }

  return buildCustomEntry(header)
}

function detectPredefinedFromSampleValues(sampleValues: string[]): PredefinedVariable | null {
  const nonEmpty = sampleValues.filter(Boolean).slice(0, 5)
  if (!nonEmpty.length) return null

  const emailMatches = nonEmpty.filter((value) => EMAIL_REGEX.test(value.trim()))
  if (emailMatches.length >= nonEmpty.length * 0.6) return 'email'

  const linkedinMatches = nonEmpty.filter((value) => LINKEDIN_REGEX.test(value.trim()))
  if (linkedinMatches.length >= nonEmpty.length * 0.6) return 'linkedin'

  const urlMatches = nonEmpty.filter((value) => URL_REGEX.test(value.trim()))
  if (urlMatches.length >= nonEmpty.length * 0.6) return 'website'

  const phoneMatches = nonEmpty.filter((value) => PHONE_REGEX.test(value.trim()))
  if (phoneMatches.length >= nonEmpty.length * 0.6) return 'phone'

  return null
}

function detectPredefinedField(header: string, sampleRows: Record<string, string>[]): PredefinedVariable | null {
  if (matchesKeywords(header, EMAIL_KEYWORDS)) return 'email'
  if (matchesKeywords(header, FIRST_NAME_KEYWORDS)) return 'firstName'
  if (matchesKeywords(header, LAST_NAME_KEYWORDS)) return 'lastName'
  if (matchesKeywords(header, COMPANY_KEYWORDS)) return 'companyName'
  if (matchesKeywords(header, JOB_TITLE_KEYWORDS)) return 'jobTitle'
  if (matchesKeywords(header, PERSONALIZATION_KEYWORDS)) return 'personalization'
  if (matchesKeywords(header, PHONE_KEYWORDS)) return 'phone'
  if (matchesKeywords(header, WEBSITE_KEYWORDS)) return 'website'
  if (matchesKeywords(header, LOCATION_KEYWORDS)) return 'location'
  if (matchesKeywords(header, LINKEDIN_KEYWORDS)) return 'linkedin'

  const sampleValues = sampleRows.map((row) => row[header] || '')
  return detectPredefinedFromSampleValues(sampleValues)
}

export function normalizeColumnMapping(input: unknown, headers: string[] = []): ColumnMapping {
  const source = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const mapping: ColumnMapping = {}
  const orderedHeaders = Array.from(new Set([...headers, ...Object.keys(source)]))

  for (const header of orderedHeaders) {
    mapping[header] = normalizeMappingEntry(header, source[header])
  }

  return mapping
}

export function detectColumns(headers: string[], sampleRows: Record<string, string>[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const usedFields = new Set<PredefinedVariable>()

  for (const header of headers) {
    const detectedField = detectPredefinedField(header, sampleRows)

    if (detectedField && !usedFields.has(detectedField)) {
      mapping[header] = buildPredefinedEntry(detectedField)
      usedFields.add(detectedField)
      continue
    }

    mapping[header] = buildCustomEntry(header)
  }

  return mapping
}

export function getMappedPredefinedField(
  mapping: ColumnMapping,
  targetField: PredefinedVariable
): string | null {
  for (const [header, entry] of Object.entries(mapping)) {
    if (entry.type === 'predefined' && entry.field === targetField) {
      return header
    }
  }

  return null
}

export function getAvailableTemplateVariables(mapping: ColumnMapping): TemplateVariableOption[] {
  const variables = Object.entries(mapping).reduce<TemplateVariableOption[]>((accumulator, [header, entry]) => {
    if (entry.type === 'predefined' && entry.field) {
      accumulator.push({
        key: PREDEFINED_VARIABLE_TOKENS[entry.field],
        label: PREDEFINED_VARIABLE_LABELS[entry.field],
        type: 'predefined',
      })
      return accumulator
    }

    if (entry.type === 'custom') {
      const variableName = entry.variableName || sanitizeVariableName(header)
      accumulator.push({
        key: variableName,
        label: variableName,
        type: 'custom',
      })
    }

    return accumulator
  }, [])

  return variables.sort((left, right) => left.label.localeCompare(right.label))
}

export function getColumnMappingValidationError(mapping: ColumnMapping): string | null {
  const seenVariables = new Set<string>()

  for (const [header, entry] of Object.entries(mapping)) {
    if (entry.type === 'predefined') {
      if (!entry.field) return `Select a valid field for "${header}".`

      const variableKey = PREDEFINED_VARIABLE_TOKENS[entry.field].toLowerCase()
      if (seenVariables.has(variableKey)) {
        return `"${PREDEFINED_VARIABLE_LABELS[entry.field]}" is mapped more than once.`
      }
      seenVariables.add(variableKey)
      continue
    }

    if (entry.type === 'custom') {
      const variableName = sanitizeVariableName(entry.variableName || header)
      if (!variableName) return `Add a custom variable name for "${header}".`

      const variableKey = variableName.toLowerCase()
      if (seenVariables.has(variableKey)) {
        return `"${variableName}" is mapped more than once.`
      }
      seenVariables.add(variableKey)
    }
  }

  return null
}

export function describeColumnMapping(entry: ColumnMappingEntry, header: string): string {
  if (entry.type === 'predefined' && entry.field) {
    return PREDEFINED_VARIABLE_LABELS[entry.field]
  }

  if (entry.type === 'custom') {
    return `Custom: ${entry.variableName || sanitizeVariableName(header)}`
  }

  return 'Do Not Import'
}
