import * as ExcelJS from 'exceljs';

async function test() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test Sheet');
  sheet.addRow(['ID', 'Name', 'Price']);
  sheet.addRow(['1', 'Project Alpha', 1250.50]);
  sheet.getCell('C2').numFmt = '$#,##0.00';
  const buffer = await workbook.xlsx.writeBuffer();
  console.log('Generated Excel Buffer size:', buffer.byteLength);
}

test().catch(console.error);
