/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */

export {
  GitRefDiffType,
}


enum GitRefDiffType {
  UNKNOWN = 'UNKNOWN',
  ZERO_REFS = 'ZERO_REFS',
  REF_COUNT_MISMATCH = 'REF_COUNT_MISMATCH',
  REF_NOT_FOUND = 'REF_NOT_FOUND',
  OID_MISMATCH = 'OID_MISMATCH',
}
