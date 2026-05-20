import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedProduct {
  product_id: string
  product_name: string
  length_cm: number
  width_cm: number
  height_cm: number
  weight_kg: number
  category?: string
  fragility?: string
  quantity?: number
  // Baseline optional
  current_box_name?: string
  current_box_length?: number
  current_box_width?: number
  current_box_height?: number
  [key: string]: any // Fallback for raw data
}

export interface ParseResult {
  data: ParsedProduct[]
  errors: ParseError[]
  validCount: number
  invalidCount: number
  totalCount: number
}

export interface ParseError {
  row: number
  message: string
  rawData: any
}

// ─── Header Normalization ────────────────────────────────────────────────
const normalizeHeader = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, '')

// ─── Column Aliases ──────────────────────────────────────────────────────
const ALIASES = {
  id: ['id', 'sku', 'productid', 'itemid', 'partnumber'],
  name: ['name', 'productname', 'itemname', 'description', 'title'],
  length: ['length', 'l', 'productlength', 'lengthcm', 'len'],
  width: ['width', 'w', 'productwidth', 'widthcm', 'wid'],
  height: ['height', 'h', 'productheight', 'heightcm', 'hgt'],
  weight: ['weight', 'wt', 'productweight', 'weightkg'],
  category: ['category', 'type', 'productcategory', 'class'],
  fragility: ['fragility', 'fragile', 'isfragile', 'risk'],
  quantity: ['quantity', 'qty', 'count', 'amount'],
  
  // Baseline matching
  box_name: ['box', 'currentbox', 'baselinebox', 'originalbox'],
  box_l: ['boxl', 'boxlength', 'currentboxl', 'currentboxlength'],
  box_w: ['boxw', 'boxwidth', 'currentboxw', 'currentboxwidth'],
  box_h: ['boxh', 'boxheight', 'currentboxh', 'currentboxheight']
}

function findValue(row: any, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeHeader(key) === alias && row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key])
      }
    }
  }
  return undefined
}

export async function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(processRawData(jsonData))
        } catch (err) {
          reject(new Error("Failed to parse Excel file"))
        }
      }
      reader.onerror = () => reject(new Error("Error reading file"))
      reader.readAsArrayBuffer(file)
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(processRawData(results.data)),
        error: (err) => reject(new Error(`CSV Parse Error: ${err.message}`))
      })
    }
  })
}

function processRawData(rows: any[]): ParseResult {
  const result: ParseResult = {
    data: [],
    errors: [],
    validCount: 0,
    invalidCount: 0,
    totalCount: rows.length
  }

  rows.forEach((row, index) => {
    const rowNum = index + 1
    
    try {
      // 1. Extract Strings
      const id = findValue(row, ALIASES.id) || `SKU-AUTO-${rowNum}`
      const name = findValue(row, ALIASES.name) || `Item ${rowNum}`
      
      const lStr = findValue(row, ALIASES.length)
      const wStr = findValue(row, ALIASES.width)
      const hStr = findValue(row, ALIASES.height)
      const wtStr = findValue(row, ALIASES.weight)
      
      // 2. Validate core dimensions
      if (!lStr || !wStr || !hStr) {
        throw new Error("Missing required dimensions (L, W, or H)")
      }

      const l = parseFloat(lStr)
      const w = parseFloat(wStr)
      const h = parseFloat(hStr)

      if (isNaN(l) || isNaN(w) || isNaN(h)) {
        throw new Error("Dimensions must be valid numbers")
      }

      if (l <= 0 || w <= 0 || h <= 0) {
        throw new Error("Dimensions must be greater than 0")
      }

      if (l > 500 || w > 500 || h > 500) {
        throw new Error("Dimension exceeds sanity limit (500cm)")
      }

      // 3. Weight Fallback (DIM Weight if missing)
      let wt = wtStr ? parseFloat(wtStr) : NaN
      if (isNaN(wt) || wt <= 0) {
        // Industry standard DIM divisor (cm3 / 5000)
        wt = (l * w * h) / 5000
      }

      // 4. Baseline Optional
      const bl = parseFloat(findValue(row, ALIASES.box_l) || '0')
      const bw = parseFloat(findValue(row, ALIASES.box_w) || '0')
      const bh = parseFloat(findValue(row, ALIASES.box_h) || '0')

      const product: ParsedProduct = {
        product_id: id,
        product_name: name,
        name: name,
        length_cm: l,
        width_cm: w,
        height_cm: h,
        weight_kg: Number(wt.toFixed(2)),
        category: findValue(row, ALIASES.category),
        fragility: findValue(row, ALIASES.fragility) || 'low',
        quantity: parseInt(findValue(row, ALIASES.quantity) || '1', 10),
        ...row // Keep raw data
      }

      if (bl > 0 && bw > 0 && bh > 0) {
        product.current_box_length = bl
        product.current_box_width = bw
        product.current_box_height = bh
        product.current_box_name = findValue(row, ALIASES.box_name) || `${bl}x${bw}x${bh}`
      }

      result.data.push(product)
      result.validCount++

    } catch (err: any) {
      result.errors.push({
        row: rowNum,
        message: err.message,
        rawData: row
      })
      result.invalidCount++
    }
  })

  return result
}

export function generateCSVTemplate() {
  const headers = [
    'sku', 'name', 'length_cm', 'width_cm', 'height_cm', 'weight_kg', 
    'category', 'fragility', 'qty', 
    'current_box_name', 'current_box_l', 'current_box_w', 'current_box_h'
  ]
  const sample = [
    'PROD-001', 'Wireless Headphones', '20.5', '15', '8', '0.45',
    'Electronics', 'Medium', '1',
    'Standard Shipper S', '25', '20', '10'
  ]
  
  const csvContent = [headers.join(','), sample.join(',')].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'packiq_bulk_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
