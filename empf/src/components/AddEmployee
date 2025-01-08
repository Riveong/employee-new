import React, { useState } from "react";
import { HotTable } from "@handsontable/react";
import { createClient } from "@supabase/supabase-js";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import supabase from "../supabase";



const AddEmployee = () => {
    const [data, setData] = useState([
      { empid: "", empname: "", department: "", site: "", classification: "", division: "", directorate: "", grouping: "" },
    ]);
  
    const columns = [
      { data: "empid", title: "Employee ID", type: "text" },
      { data: "empname", title: "Employee Name", type: "text" },
      { data: "department", title: "Department", type: "text" },
      { data: "site", title: "Site", type: "text" },
      { data: "classification", title: "Classification", type: "text" },
      { data: "division", title: "Division", type: "text" },
      { data: "directorate", title: "Directorate", type: "text" },
      { data: "grouping", title: "Grouping", type: "text" },
    ];
  
    const handleAddEmployee = async () => {
      console.log("Current Data:", data);
  
      const validData = data.filter((row) => row.empid && row.empname && row.department && row.site && row.classification);
  
      if (validData.length === 0) {
        alert("No valid data to push. Please fill in all required fields.");
        return;
      }
  
      try {
        const { data: result, error } = await supabase.from("employees").insert(validData);
  
        if (error) {
          console.error("Error adding employees:", error.message);
          alert("Failed to add employees. Check the console for details.");
        } else {
          console.log("Success:", result);
          alert("Employees added successfully!");
          setData([{ empid: "", empname: "", department: "", site: "", classification: "HO", division: "", directorate: "", grouping: "" }]); // Reset form
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Add New Employee</h2>
        <HotTable
          data={data}
          colHeaders={columns.map((col) => col.title)}
          rowHeaders={true}
          columns={columns}
          stretchH="all"
          manualColumnResize={true}
          contextMenu={true}
          licenseKey="non-commercial-and-evaluation"
          minSpareRows={1}
          afterChange={(changes, source) => {
            if (source === "edit") {
              setData([...data]);
            }
          }}
        />
        <button
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
          onClick={handleAddEmployee}
        >
          Add Employee to Supabase
        </button>
      </div>
    );
  };
  
  export default AddEmployee;
