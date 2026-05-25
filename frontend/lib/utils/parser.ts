/**
 * Parses a dimension string like "10*20*30" or "10x20x30" into numeric components.
 * @param dimString String in format L*W*H
 * @returns Object with l, w, h or null if invalid
 */
export function parseDimensions(dimString: string) {
  if (!dimString) return null
  
  // Replace x with * and split
  const parts = dimString.toLowerCase().replace(/x/g, '*').split('*')
  
  if (parts.length !== 3) return null
  
  const l = parseFloat(parts[0].trim())
  const w = parseFloat(parts[1].trim())
  const h = parseFloat(parts[2].trim())
  
  if (isNaN(l) || isNaN(w) || isNaN(h)) return null
  
  return { l, w, h }
}

/**
 * Validates the schema of the uploaded data.
 */
export function validateUploadSchema(row: any) {
  const required = [
    'product id', 
    'product name', 
    'product L*W*H', 
    'current used box L*W*H', 
    'box price'
  ]
  
  const missing = required.filter(col => !(col in row))
  if (missing.length > 0) return { valid: false, missing }
  
  // Validate dimensions format
  if (!parseDimensions(row['product L*W*H'])) return { valid: false, error: `Invalid product dimensions: ${row['product L*W*H']}` }
  if (!parseDimensions(row['current used box L*W*H'])) return { valid: false, error: `Invalid box dimensions: ${row['current used box L*W*H']}` }
  
  return { valid: true }
}
