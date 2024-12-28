import React from 'react';
import ReactDOMServer from 'react-dom/server';

const KOTPrintTemplate = ({ tableInfo, items, timestamp }) => {
  return (
    <div className="p-4 font-mono text-sm">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">KITCHEN ORDER TICKET</h2>
        <p>Table: {tableInfo?.name}</p>
        <p>Date: {new Date(timestamp).toLocaleString()}</p>
      </div>
      
      <div className="border-t border-b border-black my-2">
        <div className="grid grid-cols-12 font-bold py-1">
          <div className="col-span-1">Qty</div>
          <div className="col-span-9">Item</div>
          <div className="col-span-2">Notes</div>
        </div>
      </div>

      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 py-1">
          <div className="col-span-1">{item.quantity}</div>
          <div className="col-span-9">{item.itemName}</div>
          <div className="col-span-2"></div>
        </div>
      ))}
      
      <div className="mt-4 text-center">
        <p>*** END OF KOT ***</p>
        <p className="text-xs">KOT #: {Date.now().toString().slice(-6)}</p>
      </div>
    </div>
  );
};

const handlePrintKOT = ({ tableInfo, items }) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  // Generate the content
  const content = (
    <html>
      <head>
        <title>KOT - Table {tableInfo?.name}</title>
        <style>
          {`
            @media print {
              @page { margin: 0; }
              body { margin: 1cm; }
            }
            .font-mono { font-family: monospace; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .text-xl { font-size: 1.25rem; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
            .p-4 { padding: 1rem; }
            .mb-4 { margin-bottom: 1rem; }
            .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .grid { display: grid; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-9 { grid-column: span 9 / span 9; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .border-t { border-top-width: 1px; }
            .border-b { border-bottom-width: 1px; }
            .border-black { border-color: black; }
          `}
        </style>
      </head>
      <body>
        <KOTPrintTemplate 
          tableInfo={tableInfo} 
          items={items} 
          timestamp={new Date().toISOString()} 
        />
      </body>
    </html>
  );

  // Write the content to the new window
  printWindow.document.write(ReactDOMServer.renderToStaticMarkup(content));
  printWindow.document.close();

  // Print the window
  printWindow.onload = () => {
    printWindow.print();
    // Close the window after printing (optional)
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
};

export default handlePrintKOT;