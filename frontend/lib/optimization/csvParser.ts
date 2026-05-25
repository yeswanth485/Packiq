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

export function parseCSV(file: File): Promise<{ data: ParsedProduct[], errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const data = results.data.map((row: any, index: number) => {
          const productName = row.product_name || row.ProductName
          const length = parseFloat(row.length_cm || row.Length)
          const width = parseFloat(row.width_cm || row.Width)
          const height = parseFloat(row.height_cm || row.Height)
          const weight = parseFloat(row.weight_kg || row.Weight)
          const fragility = (row.fragility || row.Fragility || 'low').toLowerCase()
          const quantity = parseInt(row.quantity || row.Quantity || '1')

          if (!productName) errors.push(`Row ${index + 1}: Missing product name`)
          if (isNaN(length) || length <= 0) errors.push(`Row ${index + 1}: Invalid length`)
          if (isNaN(width) || width <= 0) errors.push(`Row ${index + 1}: Invalid width`)
          if (isNaN(height) || height <= 0) errors.push(`Row ${index + 1}: Invalid height`)
          if (isNaN(weight) || weight <= 0) errors.push(`Row ${index + 1}: Invalid weight`)
          if (!['low', 'medium', 'high'].includes(fragility)) errors.push(`Row ${index + 1}: Invalid fragility`)

          return {
            product_name: productName,
            original_length_cm: length,
            original_width_cm: width,
            original_height_cm: height,
            original_weight_kg: weight,
            fragility,
            quantity
          } as ParsedProduct
        })
        resolve({ data, errors })
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] })
      }
    })
  })
}
