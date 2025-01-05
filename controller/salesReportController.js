const Order = require("../model/user/orderSchema");
const User = require("../model/user/UserSchema");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');


const getSaleReport = async (req, res) => {
    try {

        const { dateRange, startDate, endDate, page = 1, limit = 10 } = req.query;


        const startingIndex = (page - 1) * limit;



        let start
        let end
        let today = new Date();

        if (dateRange) {
            switch (dateRange) {
                case 'today':
                    start = new Date(today.setHours(0, 0, 0, 0));
                    end = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    start = new Date(today.setDate(today.getDate() - 7));
                    end = new Date();
                    break;
                case 'month':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'year':
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today.getFullYear(), 11, 31);
                    break;
            }

        } else if (startDate && endDate) {
            start = new Date(startDate)
            end = new Date(endDate);
        } else {
            start = new Date('2024-12-01');
            end = new Date();
        }

        let orderQuary = {
            orderDate: { $gte: start, $lte: end },
            status: { $ne: 'Cancelled' }
        }

        const totalOrderCount = await Order.countDocuments(orderQuary);

        const orders = await Order.find(orderQuary)
        const totallength = await Order.countDocuments()
        let order = await Order.find(orderQuary).populate('userId').populate('products.productId').skip(startingIndex).limit(Number(limit))

        let totalSales = orders.reduce((total, order) => total + order.totalAmount, 0);
        let totalOrder = order.length;
        const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);
        // console.log('totalDiscount:', totalDiscount)

        const result = await Order.aggregate([
            { $match: orderQuary },
            { $group: { _id: "$userId" } },
            { $count: 'totalCostomers' }
        ]);


        const totalCostomers = result[0] ? result[0].totalCostomers : 0;

        console.log('The sales report page is loaded...');

        res.render('salesReport', {
            order,
            totalSales,
            totalOrder,
            viewOrder: totallength,
            totalCostomers,
            currentPage: Number(page),
            totalPage: Math.ceil(totalOrderCount / limit),
            limit: Number(limit),
            totalOrderCount,
            totalDiscount: totalDiscount.toFixed(2)
        });
    } catch (error) {
        console.log('getSaleReport:', error);
        res.status(500).send('Internal server Error...🥲')
    }
}

const generateSalesPDF = async (req, res) => {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const orders = await Order.find({}).populate('userId').populate('products.productId');
      
        const totalSales = orders.reduce((total, order) => total + order.totalAmount, 0);
        const totalDiscount = orders.reduce((total, order) => total + (order.discount || 0), 0);
        const totalOrders = orders.length;
        const uniqueCustomers = new Set(orders.map(order => order.userId._id.toString())).size;

        const fileName = `sales_report_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);

     
        doc.font('Helvetica-Bold')
           .fontSize(24)
           .text('Sales Report', { align: 'center' });
        doc.moveDown(2);

      
        doc.fontSize(14)
           .text('Summary Statistics', { underline: true });
        doc.moveDown();

        
        const summaryData = [
            { label: 'Total Sales', value: `Rs${totalSales.toLocaleString()}` },
            { label: 'Total Orders', value: totalOrders },
            { label: 'Total Discount', value: `Rs${totalDiscount.toLocaleString()}` },
            { label: 'Total Customers', value: uniqueCustomers }
        ];

  
        const boxWidth = 250;
        const boxHeight = 60;
        let currentX = 50;
        let currentY = doc.y;

        summaryData.forEach((item, index) => {
            if (index % 2 === 0 && index !== 0) {
                currentY += boxHeight + 10;
                currentX = 50;
            }

      
            doc.rect(currentX, currentY, boxWidth, boxHeight)
               .stroke();

          
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text(item.label, currentX + 10, currentY + 10)
               .font('Helvetica')
               .text(item.value.toString(), currentX + 10, currentY + 30);

            currentX += boxWidth + 10;
        });

        doc.moveDown(4);

     
        const tableTop = doc.y + 20;
        const tableHeaders = ['Sl No', 'User Name', 'Products', 'Quantity', 'Date', 'Discount', 'Amount'];
        const columnWidths = [40, 80, 110, 60, 80, 70, 70];
        let xPosition = 50;

        doc.font('Helvetica-Bold')
           .fontSize(12);

        tableHeaders.forEach((header, i) => {
            doc.text(header, xPosition, tableTop);
            xPosition += columnWidths[i];
        });

      
        doc.moveTo(50, tableTop - 5)
           .lineTo(550, tableTop - 5)
           .stroke();
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

      
        let yPosition = tableTop + 30;
        doc.font('Helvetica').fontSize(10);

        orders.forEach((order, index) => {
    
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
                
           
                xPosition = 50;
                doc.font('Helvetica-Bold').fontSize(12);
                tableHeaders.forEach((header, i) => {
                    doc.text(header, xPosition, yPosition);
                    xPosition += columnWidths[i];
                });
                doc.moveTo(50, yPosition - 5)
                   .lineTo(550, yPosition - 5)
                   .stroke();
                doc.moveTo(50, yPosition + 15)
                   .lineTo(550, yPosition + 15)
                   .stroke();
                yPosition += 30;
                doc.font('Helvetica').fontSize(10);
            }

            xPosition = 50;
        
            doc.text((index + 1).toString(), xPosition, yPosition);
            xPosition += columnWidths[0];
            
            doc.text(order.userId.name, xPosition, yPosition);
            xPosition += columnWidths[1];
            
            const products = order.products.map(p => p.productId.productName).join(', ');
            doc.text(products, xPosition, yPosition, { width: columnWidths[2] - 10 });
            xPosition += columnWidths[2];
            
            const quantities = order.products.map(p => p.quantity).join(', ');
            doc.text(quantities, xPosition, yPosition);
            xPosition += columnWidths[3];
            
            doc.text(new Date(order.orderDate).toLocaleDateString(), xPosition, yPosition);
            xPosition += columnWidths[4];
            
            doc.text(`Rs${order.discount || 0}`, xPosition, yPosition);
            xPosition += columnWidths[5];
            
            doc.text(`Rs${order.totalAmount}`, xPosition, yPosition);

           
            doc.moveTo(50, yPosition + 15)
               .lineTo(550, yPosition + 15)
               .stroke();

            yPosition += 20;
        });

      
        doc.fontSize(10)
           .text(`Report generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
               align: 'center'
           });

        doc.end();
    } catch (error) {
        console.log('generateSalesPDF:', error);
        res.status(500).send('Error generating PDF');
    }
};

const generateSalesExel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        
        
        const orders = await Order.find()
            .populate('userId')
            .populate('products.productId');

 
        const totalSales = orders.reduce((total, order) => total + order.totalAmount, 0);
        const totalDiscount = orders.reduce((total, order) => total + (order.discount || 0), 0);
        const totalOrders = orders.length;
        const uniqueCustomers = new Set(orders.map(order => order.userId._id.toString())).size;

       
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Sales Report';
        titleCell.font = {
            size: 16,
            bold: true
        };
        titleCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        worksheet.getRow(1).height = 30;

        
        worksheet.mergeCells('A3:B3');
        worksheet.getCell('A3').value = 'Summary Statistics';
        worksheet.getCell('A3').font = { bold: true, size: 12 };

        const summaryData = [
            ['Total Sales:', `Rs${totalSales.toLocaleString()}`],
            ['Total Orders:', totalOrders],
            ['Total Discount:', `Rs${totalDiscount.toLocaleString()}`],
            ['Total Customers:', uniqueCustomers]
        ];

        let summaryRow = 4;
        summaryData.forEach(([label, value]) => {
            worksheet.getCell(`A${summaryRow}`).value = label;
            worksheet.getCell(`B${summaryRow}`).value = value;
            worksheet.getCell(`A${summaryRow}`).font = { bold: true };
            summaryRow++;
        });

 
        worksheet.getColumn('A').width = 20;
        worksheet.getColumn('B').width = 20;

        const tableStartRow = summaryRow + 2;

      
        worksheet.columns = [
            { header: 'Sl No', key: 'sl', width: 10 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Products', key: 'products', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Discount Amount', key: 'discount', width: 20 },
            { header: 'Final Amount', key: 'finalAmount', width: 20 }
        ];


        const headerRow = worksheet.getRow(tableStartRow);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        headerRow.border = {
            bottom: { style: 'thin' }
        };

       
        orders.forEach((order, i) => {
            const rowNumber = tableStartRow + i + 1;
            const row = worksheet.addRow({
                sl: i + 1,
                userName: order.userId.name,
                products: order.products.map(product => product.productId.productName).join(', '),
                quantity: order.products.map(product => product.quantity).join(', '),
                date: new Date(order.orderDate).toLocaleDateString(),
                discount: `Rs${(order.discount || 0).toLocaleString()}`,
                finalAmount: `Rs${order.totalAmount.toLocaleString()}`
            });

            if (i % 2 === 1) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFDFDFD' }
                };
            }

            row.getCell('sl').alignment = { horizontal: 'center' };
            row.getCell('date').alignment = { horizontal: 'center' };
            row.getCell('discount').alignment = { horizontal: 'right' };
            row.getCell('finalAmount').alignment = { horizontal: 'right' };

           
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });


        const footerRow = worksheet.addRow(['']);
        footerRow.getCell(1).value = `Report generated on: ${new Date().toLocaleString()}`;
        footerRow.getCell(1).font = { italic: true };
        worksheet.mergeCells(footerRow.number, 1, footerRow.number, 7);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=sales_report.xlsx'
        );

   
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log('generateSalesExcel:', error);
        res.status(500).send('Error generating Excel report');
    }
};

    module.exports = {
        getSaleReport,
        generateSalesPDF,
        generateSalesExel
    }