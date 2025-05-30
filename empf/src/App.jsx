import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  UserPlus,
  AlertCircle,
  Menu,
  X,
  ArrowDownToLine,
  Filter,
  RefreshCw,
  LogOut,
} from "lucide-react";
import Stats from "./components/stats";
import supabase from "./supabase";
import Export from "./components/ExportData";
import AddEmployee from "./components/AddEmployee";

const EmployeeDatabase = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("uid");
  const [siteFilter, setSiteFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("search");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Changed to false by default for mobile
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check session on page load
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();
  }, []);

  // Get unique sites for filter dropdown
  const [uniqueSites, setUniqueSites] = useState([]);
  
  useEffect(() => {
    if (session) {
      const fetchSites = async () => {
        const { data, error } = await supabase
          .from("employees")
          .select("site")
          .not("site", "is", null)
          .neq("site", "");
        
        if (!error && data) {
          const sites = [...new Set(data.map(emp => emp.site).filter(Boolean))];
          setUniqueSites(sites);
        }
      };
      fetchSites();
    }
  }, [session]);

  // Manual search function
  const handleSearch = async () => {
    if (!session) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      let query = supabase
        .from("employees")
        .select("*", { count: 'exact' })
        .not("uid", "is", null)
        .neq("uid", "");

      if (searchQuery.trim()) {
        if (searchType === "uid") {
          query = query.ilike("uid", `%${searchQuery.trim()}%`);
        } else if (searchType === "empid") {
          const searchValue = searchQuery.trim();
          if (!isNaN(searchValue)) {
            query = query.eq("empid", parseInt(searchValue));
          } else {
            query = query.like("empid::text", `%${searchValue}%`);
          }
        }
      }

      if (siteFilter) {
        query = query.eq("site", siteFilter);
      }

      const { data, error, count } = await query.order("empname");

      if (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to fetch employees. Please try again.");
      } else {
        console.log(`Fetched ${data?.length || 0} employees with UID out of ${count || 0} total`);
        setEmployees(data || []);
        setCurrentPage(1);
        setError("");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred during search.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Remove UID and password from employee record
  const removeUidAndPassword = async (employee) => {
    setLoading(true);
    const { uid, password, ...rest } = employee;

    // Update the employee record in Supabase
    const { data, error } = await supabase
      .from("employees")
      .update({ uid: null, password: null })
      .eq("empid", employee.empid);

    if (error) {
      console.error("Error updating employee:", error);
      setLoading(false);
      return employee;
    }

    // Refresh the data
    const updatedEmployees = employees.map((emp) =>
      emp.empid === employee.empid ? { ...emp, uid: null, password: null } : emp
    );
    setEmployees(updatedEmployees);
    setLoading(false);
    return rest;
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Invalid email or password. Please try again.");
    } else {
      setSession(data.session);
      setError("");
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Clear all filters and results
  const clearFilters = () => {
    setSearchQuery("");
    setSiteFilter("");
    setSearchType("uid");
    setEmployees([]);
    setHasSearched(false);
    setError("");
  };

  // Duplicate function
  const findDuplicates = () => {
    const duplicates = employees.reduce((acc, current) => {
      if (!current || !current.uid) return acc;
      const key = current.uid.toLowerCase();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(current);
      return acc;
    }, {});
    return Object.values(duplicates).filter((group) => group.length > 1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const renderContent = () => {
    switch (activeView) {
      case "search":
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Search and Filter Header */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="space-y-4">
                {/* Search Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search by ${
                          searchType === "uid" ? "UID Kahoot" : "Employee ID"
                        }...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 sm:min-w-[140px]"
                    >
                      <option value="uid">UID Kahoot</option>
                      <option value="empid">Employee ID</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {siteFilter && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          1
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Filters */}
                {isFilterOpen && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site
                        </label>
                        <select
                          value={siteFilter}
                          onChange={(e) => setSiteFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Sites</option>
                          {uniqueSites.map((site) => (
                            <option key={site} value={site}>
                              {site}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Summary */}
            {hasSearched && (
              <div className="px-1">
                <p className="text-sm text-gray-600">
                  {loading
                    ? "Searching..."
                    : `${employees.length} employee${
                        employees.length !== 1 ? "s" : ""
                      } with UID Kahoot found`}
                </p>
              </div>
            )}

            {/* Initial State - Before Search */}
            {!hasSearched && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
                <div className="text-center">
                  <Search className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
                    Search Employee Database
                  </h3>
                  <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">
                    Enter a UID Kahoot or Employee ID to search for employees with registered UIDs
                  </p>
                  <div className="text-xs md:text-sm text-gray-400">
                    💡 Tip: Use filters to narrow down your search by site
                  </div>
                </div>
              </div>
            )}

            {/* Table - Mobile Card View / Desktop Table View */}
            {hasSearched && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Site
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          UID Kahoot
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employees
                        .slice(startIndex, startIndex + itemsPerPage)
                        .map((employee, index) => (
                          <tr
                            key={employee.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-25"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.empname}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 font-mono">
                                {employee.empid}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {employee.site}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 font-mono">
                                {employee.uid || (
                                  <span className="text-gray-400 italic">
                                    Not set
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                className="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                                onClick={() => {
                                  const confirmation = confirm(
                                    `Are you sure you want to reset UID for ${employee.empid} / ${employee.empname}?`
                                  );
                                  if (confirmation) {
                                    removeUidAndPassword(employee);
                                  }
                                }}
                              >
                                {loading ? "Resetting..." : "Reset UID"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {employees
                    .slice(startIndex, startIndex + itemsPerPage)
                    .map((employee) => (
                      <div key={employee.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {employee.empname}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                              ID: {employee.empid}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                            {employee.site}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              UID Kahoot
                            </span>
                            <div className="text-sm text-gray-900 font-mono">
                              {employee.uid || (
                                <span className="text-gray-400 italic">Not set</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            className="w-full inline-flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                            onClick={() => {
                              const confirmation = confirm(
                                `Are you sure you want to reset UID for ${employee.empid} / ${employee.empname}?`
                              );
                              if (confirmation) {
                                removeUidAndPassword(employee);
                              }
                            }}
                          >
                            {loading ? "Resetting..." : "Reset UID"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {employees.length === 0 && (
                  <div className="text-center py-8 md:py-12 px-4">
                    <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm md:text-base">
                      No employees found matching your criteria
                    </p>
                    <p className="text-gray-400 text-xs md:text-sm mt-2">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination - Responsive */}
            {hasSearched && employees.length > 0 && (
              <div className="bg-white px-4 py-4 md:px-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, employees.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{employees.length}</span> results
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-xs md:text-sm rounded-lg border transition-colors ${
                        currentPage === 1
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-xs md:text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-xs md:text-sm rounded-lg border transition-colors ${
                        currentPage === totalPages
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "statistics":
        return <Stats />;
      case "export":
        return <Export />;
      case "add":
        return <AddEmployee />;
      case "duplicates":
        const duplicates = findDuplicates();
        return (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Duplicate Employees</h2>
            {duplicates.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <AlertCircle className="mx-auto h-10 w-10 md:h-12 md:w-12 text-green-400 mb-4" />
                <p className="text-gray-500 text-sm md:text-base">No duplicates found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {duplicates.map((group, index) => (
                  <div
                    key={index}
                    className="p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <h3 className="font-medium text-yellow-800 mb-3 text-sm md:text-base">
                      Duplicated UID:{" "}
                      <span className="font-mono">{group[0].uid}</span>
                    </h3>
                    <div className="space-y-2">
                      {group.map((employee) => (
                        <div
                          key={employee.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded border gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">
                              {employee.empname}
                            </span>
                            <span className="text-gray-500 ml-2 text-sm">
                              ({employee.empid})
                            </span>
                          </div>
                          <span className="text-gray-500 font-mono text-xs md:text-sm">
                            {employee.site}
                          </span>
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
      {session ? (
        <>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sidebar Overlay for Mobile */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 w-64 bg-white shadow-lg transition-transform z-40`}
          >
            <div className="p-4 md:p-6 h-full flex flex-col">
              <div className="flex-shrink-0">
                <img src="/logo.png" alt="Logo" className="p-6 md:p-10 w-full" />
              </div>
              
              <nav className="space-y-1 flex-1 overflow-y-auto">
              {[
                  {
                    key: "search",
                    label: "Search",
                    icon: Search,
                  },
                  {
                    key: "statistics",
                    label: "Statistics",
                    icon: Users,
                  },
                  {
                    key: "export",
                    label: "Export",
                    icon: ArrowDownToLine,
                  },
                  {
                    key: "add",
                    label: "Add Employee",
                    icon: UserPlus,
                  },
                  {
                    key: "duplicates",
                    label: "Duplicates",
                    icon: AlertCircle,
                  }
              ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveView(key);
                      // Close sidebar on mobile after selection
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 md:px-4 rounded-lg transition-colors text-sm md:text-base ${
                      activeView === key
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>

              {/* Logout Button at Bottom */}
              <div className="border-t border-gray-200 pt-4 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 md:px-4 rounded-lg transition-colors text-red-600 hover:bg-red-50 text-sm md:text-base"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`lg:ml-64 p-4 md:p-6 transition-all duration-200`}>
            {renderContent()}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <form
            onSubmit={handleLogin}
            className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100"
          >
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                Please sign in to continue
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeDatabase;
