import React, { useState, useEffect } from 'react';
import { Search, Users, UserPlus, AlertCircle, Menu, X, ArrowDownToLine } from 'lucide-react';
import Stats from './components/stats';
import supabase from './supabase';



const EmployeeDatabase = () => {
  // States
  const [employees, setEmployees] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState('search');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const itemsPerPage = 9;
  const [paginatedEmployees, setPaginatedEmployees] = useState([]);
  const [stats, setStats] = useState(null);



  // Find duplicates function
  const findDuplicates = () => {
    const duplicates = employees.reduce((acc, current) => {
      const key = current.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(current);
      return acc;
    }, {});

    return Object.values(duplicates).filter(group => group.length > 1);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .ilike("uid", `%${searchQuery}%`);
      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        setEmployees(data);
        setCurrentPage(1); // Reset to first page when search query changes
      }
    };

    fetchEmployees();
  }, [searchQuery]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedEmployees(employees.slice(startIndex, endIndex));
  }, [employees, currentPage]);


  const filteredEmployees = employees.filter(employee =>
    employee.uid && employee.uid.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const renderContent = () => {
    switch (activeView) {
      case 'search':
        return (
          <>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
      
            {/* Employee Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID Kahoot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.empname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.empid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.site}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.uid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, employees.length)} of {employees.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );
        case 'statistics':
          return stats === null ? <Stats /> : null;
        case 'export':
          return (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-6">Export Employee Data</h2>
              <button 
                onClick={() => {}}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                Export to CSV
              </button>
            </div>
          );
      case 'add':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Add New Employee</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                Add Employee
              </button>
            </form>
          </div>
        );

      case 'duplicates':
        const duplicates = findDuplicates();
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Duplicate Employees</h2>
            {duplicates.length === 0 ? (
              <p className="text-gray-500">No duplicates found.</p>
            ) : (
              <div className="space-y-4">
                {duplicates.map((group, index) => (
                  <div key={index} className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">Duplicate Name: {group[0].name}</h3>
                    <div className="space-y-2">
                      {group.map(employee => (
                        <div key={employee.id} className="flex justify-between items-center p-2 bg-white rounded">
                          <span>{employee.email}</span>
                          <span className="text-gray-500">{employee.department}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-white shadow-lg z-40`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-8">Employee Manager</h1>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveView('search')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === 'search' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={20} />
              <span>Search UID</span>
            </button>
            <button
              onClick={() => setActiveView('statistics')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === 'statistics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={20} />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setActiveView('export')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === 'export' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ArrowDownToLine size={20} />
              <span>Export data</span>
            </button>
            <button
              onClick={() => setActiveView('add')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === 'add' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <UserPlus size={20} />
              <span>Add Employee</span>
            </button>
            <button
              onClick={() => setActiveView('duplicates')}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === 'duplicates' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <AlertCircle size={20} />
              <span>Find Duplicates</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-64 transition-margin duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDatabase;