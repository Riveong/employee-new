import React, { useState, useEffect } from 'react';
import { Search, Users, UserPlus, AlertCircle, Menu, X, ArrowDownToLine } from 'lucide-react';
import Stats from './components/stats';
import supabase from './supabase';

const EmployeeDatabase = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState('search');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const itemsPerPage = 9;
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check session on page load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();
  }, []);

  // Fetch employees
  useEffect(() => {
    if (session) {
      const fetchEmployees = async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .ilike('uid', `%${searchQuery}%`);
        if (error) {
          console.error('Error fetching employees:', error);
        } else {
          setEmployees(data);
          setCurrentPage(1);
        }
      };
      fetchEmployees();
    }
  }, [searchQuery, session]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError('Invalid email or password. Please try again.');
    } else {
      setSession(data.session);
      setError('');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Duplicate function
  const findDuplicates = () => {
    const duplicates = employees.reduce((acc, current) => {
      const key = current.uid.toLowerCase();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(current);
      return acc;
    }, {});
    return Object.values(duplicates).filter(group => group.length > 1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const renderContent = () => {
    switch (activeView) {
      case 'search':
        return (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">NIK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Site</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">UID Kahoot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.slice(startIndex, startIndex + itemsPerPage).map((employee) => (
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

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, employees.length)} of {employees.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        );
      case 'statistics':
        return <Stats />;
      case 'export':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">Export Employee Data</h2>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
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
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
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
              duplicates.map((group, index) => (
                <div key={index} className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">Duplicated UID: {group[0].uid}</h3>
                  {group.map(employee => (
                    <div key={employee.id} className="flex justify-between items-center p-2 bg-white rounded">
                      <span>{employee.email}</span>
                      <span className="text-gray-500">{employee.department}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {session ? (
        <>
          <button onClick={handleLogout} className="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded">Log out</button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-white shadow-lg`}>
            <div className="p-6">
              <img src='/logo.png' alt="Logo" className="p-10" />
              <nav className="space-y-2">
                {['search', 'statistics', 'export', 'add', 'duplicates'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${activeView === view ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className={`lg:ml-64 p-6`}>{renderContent()}</div>
        </>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-6">Login</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded">Login</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeDatabase;
