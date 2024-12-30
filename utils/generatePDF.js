
const PDFDocument = require('pdfkit');

const generatePDF = (reportData) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        return pdfData;
    });

    doc.fontSize(16).text('Sales Report', { align: 'center' });
    doc.moveDown();

    reportData.forEach((order, i) => {
        doc.fontSize(12).text(`Order ${i + 1}`);
        doc.text(`User Name: ${order.userId.name}`);
        doc.text(`Total Amount: ₹${order.totalAmount}`);
        doc.text(`Date: ${order.orderDate.toISOString().substring(0, 10)}`);
        doc.moveDown();
    });

    doc.end();
};

module.exports = generatePDF;
