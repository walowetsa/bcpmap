import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'agentdataprocessed.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Excel file not found' }, 
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      cellDates: true,
      cellNF: true
    });

    const activeSheet = workbook.Sheets['Geocoded Addresses'];
    
    if (!activeSheet) {
      return NextResponse.json(
        { error: 'Active sheet not found in Excel file' }, 
        { status: 404 }
      );
    }

    const jsonData = XLSX.utils.sheet_to_json(activeSheet);

    return NextResponse.json({
      data: jsonData,
      rowCount: jsonData.length
    });

  } catch (error) {
    console.error('Error reading Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to read Excel file', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}