// Test using node-thermal-printer library (already installed)
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

async function test() {
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'printer:EPSON TM-U220 Receipt',
      width: 42,
      characterSet: 'PC437_USA',
      removeSpecialCharacters: false,
      options: {
        timeout: 10000,
      },
    });

    const isConnected = await printer.isPrinterConnected();
    console.log('Connected:', isConnected);

    if (isConnected) {
      printer.alignCenter();
      printer.println('RAHMAT TOYS');
      printer.println('Jl. A. Yani No 21');
      printer.println('Telp: 08767654332');
      printer.println('---------------------');
      printer.alignLeft();
      printer.table(['Item', 'Qty', 'Price']);
      printer.table(['Mainan Edukasi', '2', '50,000']);
      printer.table(['Boneka Kecil', '1', '15,000']);
      printer.println('---------------------');
      printer.alignRight();
      printer.println('Total: Rp 66,500');
      printer.println('Cash: Rp 100,000');
      printer.println('Change: Rp 33,500');
      printer.println(' ');
      printer.alignCenter();
      printer.println('Terima kasih!');
      printer.cut();
      
      await printer.execute();
      console.log('Print successful!');
    }
  } catch (err) {
    console.error('Print error:', err.message);
    console.error(err.stack);
  }
}

test();
