import Papa from 'papaparse'

export interface ParsedProduct {
  product_name: string
  original_length_cm: number
  original_width_cm: number
  original_height_cm: number
  original_weight_kg: number
  fragility: 'low' | 'medium' | 'high'
  quantity: number
}

// 🔴 BUG #4 FIX: Normalize column headers for flexibility
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}]/g, '')              // Remove brackets
    .replace(/[_\s\-/|]+/g, '_')            // Normalize spacing/separators
    .replace(/_+/g, '_')                    // Remove duplicate underscores
    .replace(/^_|_$/g, '')                  // Remove leading/trailing underscores
}

// 🔴 BUG #4 FIX: Find column value with flexible matching
function findColumnValue(row: any, possibleNames: string[]): string {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return String(row[name]).trim()
    }
  }
  return ''
}

// 🔴 BUG #4 FIX: Parse CSV with flexible header matching
export function parseCSV(file: File): Promise<{ data: ParsedProduct[], errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        
        // 🔴 BUG #4 FIX: Build normalized header map from first row
        const headerMap: Record<string, string[]> = {}
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>
          const originalHeaders = Object.keys(firstRow)
          
          // Map normalized headers to original column names
          for (const header of originalHeaders) {
            const normalized = normalizeHeader(header)
            if (!headerMap[normalized]) {
              headerMap[normalized] = []
            }
            headerMap[normalized].push(header)
          }
        }
        
        const data = results.data.map((row: any, index: number) => {
          // 🔴 BUG #4 FIX: Try multiple variations of each field
          const productName = findColumnValue(row, [
            ...( headerMap['product_name'] || []),
            ...( headerMap['product'] || []),
            ...( headerMap['name'] || []),
            ...( headerMap['item_name'] || []),
            'product_name', 'ProductName', 'product', 'name', 'Product Name', 'Item Name'
          ])
          
          const lengthStr = findColumnValue(row, [
            ...( headerMap['length_cm'] || []),
            ...( headerMap['length'] || []),
            ...( headerMap['l'] || []),
            'length_cm', 'Length', 'L', 'length'
          ])
          
          const widthStr = findColumnValue(row, [
            ...( headerMap['width_cm'] || []),
            ...( headerMap['width'] || []),
            ...( headerMap['w'] || []),
            'width_cm', 'Width', 'W', 'width'
          ])
          
          const heightStr = findColumnValue(row, [
            ...( headerMap['height_cm'] || []),
            ...( headerMap['height'] || []),
            ...( headerMap['h'] || []),
            'height_cm', 'Height', 'H', 'height'
          ])
          
          const weightStr = findColumnValue(row, [
            ...( headerMap['weight_kg'] || []),
            ...( headerMap['weight'] || []),
            ...( headerMap['wt'] || []),
            'weight_kg', 'Weight', 'weight'
          ])
          
          const fragility = (findColumnValue(row, [
            ...( headerMap['fragility'] || []),
            ...( headerMap['fragile'] || []),
            ...( headerMap['fragility_level'] || []),
            'fragility', 'Fragility', 'fragile', 'Fragile'
          ]) || 'low').toLowerCase()
          
          const quantityStr = findColumnValue(row, [
            ...( headerMap['quantity'] || []),
            ...( headerMap['qty'] || []),
            ...( headerMap['qty'] || []),
            'quantity', 'Quantity', 'qty', 'Qty'
          ]) || '1'

          // Parse numeric values
          const length = parseFloat(lengthStr)
          const width = parseFloat(widthStr)
          const height = parseFloat(heightStr)
          const weight = parseFloat(weightStr)
          const quantity = parseInt(quantityStr)

          // 🔴 BUG #4 FIX: Better error messages with row number
          if (!productName) {
            errors.push(`Row ${index + 2}: Missing product name (checked: name, product, product_name)`)
          }
          if (isNaN(length) || length <= 0) {
            errors.push(`Row ${index + 2}: Invalid or missing length (got: "${lengthStr}"). Must be positive number`)
          }
          if (isNaN(width) || width <= 0) {
            errors.push(`Row ${index + 2}: Invalid or missing width (got: "${widthStr}"). Must be positive number`)
          }
          if (isNaN(height) || height <= 0) {
            errors.push(`Row ${index + 2}: Invalid or missing height (got: "${heightStr}"). Must be positive number`)
          }
          if (isNaN(weight) || weight <= 0) {
            errors.push(`Row ${index + 2}: Invalid or missing weight (got: "${weightStr}"). Must be positive number`)
          }
          if (!['low', 'medium', 'high'].includes(fragility)) {
            errors.push(`Row ${index + 2}: Invalid fragility "${fragility}". Must be: low, medium, or high`)
          }

          return {
            product_name: productName,
            original_length_cm: isNaN(length) ? 0 : length,
            original_width_cm: isNaN(width) ? 0 : width,
            original_height_cm: isNaN(height) ? 0 : height,
            original_weight_kg: isNaN(weight) ? 0 : weight,
            fragility: ['low', 'medium', 'high'].includes(fragility) ? (fragility as 'low' | 'medium' | 'high') : 'low',
            quantity: isNaN(quantity) ? 1 : Math.max(1, quantity)
          } as ParsedProduct
        })
        resolve({ data, errors })
      },
      error: (error) => {
        resolve({ data: [], errors: [`CSV parsing error: ${error.message}`] })
      }
    })
  })
}
