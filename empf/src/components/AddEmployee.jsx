import React, { useState } from "react";
import { UserPlus, Save, RefreshCw, CheckCircle, AlertCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import supabase from "../supabase";
import * as XLSX from 'xlsx';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    empid: "",
    empname: "",
    department: "",
    site: "",
    classification: "",
    division: "",
    directorate: "",
    grouping: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadResults, setUploadResults] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const resetForm = () => {
    setFormData({
      empid: "",
      empname: "",
      department: "",
      site: "",
      classification: "",
      division: "",
      directorate: "",
      grouping: "",
    });
    setMessage({ type: "", text: "" });
    setUploadResults(null);
  };

  const validateForm = () => {
    const requiredFields = ["empid", "empname", "department", "site", "classification"];
    const emptyFields = requiredFields.filter(field => !formData[field].trim());
    
    if (emptyFields.length > 0) {
      setMessage({
        type: "error",
        text: `Please fill in all required fields: ${emptyFields.join(", ")}`
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { data: result, error } = await supabase
        .from("employees")
        .insert([formData])
        .select();

      if (error) {
        console.error("Error adding employee:", error);
        setMessage({
          type: "error",
          text: `Failed to add employee: ${error.message}`
        });
      } else {
        console.log("Success:", result);
        setMessage({
          type: "success",
          text: `Employee ${formData.empname} added successfully!`
        });
        resetForm();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Download Excel Template
  const downloadTemplate = () => {
    const templateData = [
      {
        empid: "12345",
        empname: "John Doe",
        department: "Information Technology",
        site: "Head Office",
        classification: "HO",
        division: "Digital Technology",
        directorate: "Technology & Innovation",
        grouping: "IT Support"
      },
      {
        empid: "67890",
        empname: "Jane Smith",
        department: "Human Resources",
        site: "Branch Office",
        classification: "SITE",
        division: "People & Culture",
        directorate: "Corporate Services",
        grouping: "HR Operations"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // empid
      { wch: 25 }, // empname
      { wch: 25 }, // department
      { wch: 20 }, // site
      { wch: 15 }, // classification
      { wch: 25 }, // division
      { wch: 30 }, // directorate
      { wch: 20 }  // grouping
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Template");
    XLSX.writeFile(workbook, "employee_template.xlsx");
    
    setMessage({
      type: "success",
      text: "Excel template downloaded successfully!"
    });
  };

  // Handle Excel Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setMessage({ type: "", text: "" });
    setUploadResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setMessage({
          type: "error",
          text: "No data found in the Excel file."
        });
        setUploadLoading(false);
        return;
      }

      // Validate required columns
      const requiredColumns = ['empid', 'empname', 'department', 'site', 'classification'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));

      if (missingColumns.length > 0) {
        setMessage({
          type: "error",
          text: `Missing required columns: ${missingColumns.join(", ")}`
        });
        setUploadLoading(false);
        return;
      }

      // Get existing employee IDs to check for duplicates
      const { data: existingEmployees, error: fetchError } = await supabase
        .from("employees")
        .select("empid");

      if (fetchError) {
        setMessage({
          type: "error",
          text: "Failed to check existing employees."
        });
        setUploadLoading(false);
        return;
      }

      const existingEmpIds = new Set(existingEmployees.map(emp => emp.empid.toString()));
      
      let processed = 0;
      let added = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails = [];

      // Process each row
      for (const row of jsonData) {
        processed++;
        
        // Check if required fields are present
        const missingFields = requiredColumns.filter(field => !row[field] || row[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          errors++;
          errorDetails.push(`Row ${processed}: Missing ${missingFields.join(", ")}`);
          continue;
        }

        // Check for duplicate
        if (existingEmpIds.has(row.empid.toString())) {
          skipped++;
          continue;
        }

        // Prepare employee data
        const employeeData = {
          empid: row.empid.toString(),
          empname: row.empname.toString(),
          department: row.department.toString(),
          site: row.site.toString(),
          classification: row.classification.toString(),
          division: row.division ? row.division.toString() : "",
          directorate: row.directorate ? row.directorate.toString() : "",
          grouping: row.grouping ? row.grouping.toString() : "",
        };

        // Insert into database
        try {
          const { error: insertError } = await supabase
            .from("employees")
            .insert([employeeData]);

          if (insertError) {
            errors++;
            errorDetails.push(`Row ${processed}: Database error - ${insertError.message}`);
          } else {
            added++;
            existingEmpIds.add(employeeData.empid); // Add to set to avoid duplicates in same upload
          }
        } catch (err) {
          errors++;
          errorDetails.push(`Row ${processed}: Unexpected error - ${err.message}`);
        }
      }

      // Set upload results
      setUploadResults({
        processed,
        added,
        skipped,
        errors,
        errorDetails
      });

      if (added > 0) {
        setMessage({
          type: "success",
          text: `Upload completed! ${added} employees added, ${skipped} duplicates skipped, ${errors} errors.`
        });
      } else if (errors > 0) {
        setMessage({
          type: "error",
          text: `Upload completed with ${errors} errors. ${skipped} duplicates were skipped.`
        });
      } else {
        setMessage({
          type: "warning",
          text: `All ${skipped} employees already exist in the database.`
        });
      }

    } catch (err) {
      console.error("File processing error:", err);
      setMessage({
        type: "error",
        text: "Failed to process the Excel file. Please check the file format."
      });
    } finally {
      setUploadLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <UserPlus className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Add New Employee
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Add employees individually using the form below, or upload multiple employees using Excel.
        </p>
      </div>

      {/* Excel Upload Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Bulk Upload</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Template */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Step 1: Download Template</h4>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </button>
            <p className="text-xs text-gray-500">
              Download the template with sample data and required format.
            </p>
          </div>

          {/* Upload File */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Step 2: Upload Filled Template</h4>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload your filled Excel file. Duplicates will be automatically skipped.
            </p>
          </div>
        </div>

        {/* Upload Results */}
        {uploadResults && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Upload Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded border">
                <div className="text-lg font-semibold text-gray-900">{uploadResults.processed}</div>
                <div className="text-xs text-gray-500">Processed</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-lg font-semibold text-green-600">{uploadResults.added}</div>
                <div className="text-xs text-gray-500">Added</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-lg font-semibold text-yellow-600">{uploadResults.skipped}</div>
                <div className="text-xs text-gray-500">Skipped</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-lg font-semibold text-red-600">{uploadResults.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
            
            {uploadResults.errorDetails.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-red-700 mb-2">Error Details:</h5>
                <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded border">
                  {uploadResults.errorDetails.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 mb-1">{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Individual Form Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Individual Entry</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Alert */}
          {message.text && (
            <div className={`p-4 rounded-lg border flex items-center gap-3 ${
              message.type === "success" 
                ? "bg-green-50 border-green-200 text-green-800"
                : message.type === "warning"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                name="empid"
                value={formData.empid}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter employee ID"
                required
              />
            </div>

            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name *
              </label>
              <input
                type="text"
                name="empname"
                value={formData.empname}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter employee name"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department"
                required
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site *
              </label>
              <input
                type="text"
                name="site"
                value={formData.site}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site"
                required
              />
            </div>

            {/* Classification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classification *
              </label>
              <select
                name="classification"
                value={formData.classification}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select classification</option>
                <option value="HO">Head Office</option>
                <option value="SITE">Site</option>
                <option value="CONTRACTOR">Contractor</option>
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division
              </label>
              <input
                type="text"
                name="division"
                value={formData.division}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter division (optional)"
              />
            </div>

            {/* Directorate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Directorate
              </label>
              <input
                type="text"
                name="directorate"
                value={formData.directorate}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter directorate (optional)"
              />
            </div>

            {/* Grouping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grouping
              </label>
              <input
                type="text"
                name="grouping"
                value={formData.grouping}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter grouping (optional)"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Add Employee
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Bulk Upload:</strong> Download the template, fill it with employee data, then upload</li>
          <li>• <strong>Duplicate Handling:</strong> Employees with existing IDs will be automatically skipped</li>
          <li>• <strong>Required Fields:</strong> Employee ID, Name, Department, Site, and Classification are mandatory</li>
          <li>• <strong>File Format:</strong> Only Excel files (.xlsx, .xls) are supported for upload</li>
          <li>• The system will provide detailed results after bulk upload completion</li>
        </ul>
      </div>
    </div>
  );
};

export default AddEmployee;
