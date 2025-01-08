import { useState } from 'react';
import supabase from '../supabase'; // Adjust the import path as needed
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportData = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Fetch all employees data from Supabase
            const { data, error } = await supabase
                .from('employees')
                .select('*');

            if (error) throw error;

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Download file
            saveAs(dataBlob, 'employees_data.xlsx');

        } catch (error) {
            console.error('Export failed:', error.message);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
    );
};

export default ExportData;
