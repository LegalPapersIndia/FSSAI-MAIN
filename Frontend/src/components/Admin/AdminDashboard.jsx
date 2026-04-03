import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');

    if (!isLoggedIn) {
      navigate('/admin');
      return;
    }

    fetchLeads();
  }, [navigate]);

  const fetchLeads = async () => {
    try {
      const credentials = btoa(
        `${import.meta.env.VITE_ADMIN_USERNAME}:${import.meta.env.VITE_ADMIN_PASSWORD}`
      );

      const response = await fetch(`${API_URL}/api/leads`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('adminLoggedIn');
        alert("Session expired. Please login again.");
        navigate('/admin');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error:', error);
      alert("Backend se connect nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    navigate('/admin');
  };

  // ✅ FILTER
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        (lead.applicant_name?.toLowerCase() || '').includes(searchLower) ||
        (lead.mobile || '').includes(searchTerm) ||
        (lead.email?.toLowerCase() || '').includes(searchLower);

      const matchesStatus =
        filterStatus === 'all' || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, filterStatus]);

  // ✅ EXPORT EXCEL
  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert("No data to export");
      return;
    }

    const data = filteredLeads.map((lead) => ({
      "Date & Time": new Date(lead.submittedAt).toLocaleString(),
      "Applicant Name": lead.applicant_name,
      "Mobile": lead.mobile,
      "Email": lead.email,
      "Business": lead.nature_of_business,
      "State": lead.state,
      "Status": lead.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto column width
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: key.length + 10,
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, `FSSAI_Leads_${Date.now()}.xlsx`);
  };

  const viewRawPayload = (lead) => {
    alert(JSON.stringify(lead.rawPayload || lead, null, 2));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-green-700">
              FSSAI Leads Dashboard
            </h1>
            <p>Total Leads: {leads.length}</p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={fetchLeads}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl"
            >
              🔄 Refresh
            </button>

            <button
              onClick={exportToExcel}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl"
            >
              📥 Export Excel
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-3 rounded-2xl"
            >
              Logout
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border rounded-xl flex-1"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-3 border rounded-xl"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Mobile</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Business</th>
                <th className="p-4 text-left">State</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} className="border-b">
                    <td className="p-4">
                      {new Date(lead.submittedAt).toLocaleString()}
                    </td>
                    <td className="p-4">{lead.applicant_name}</td>
                    <td className="p-4">{lead.mobile}</td>
                    <td className="p-4">{lead.email}</td>
                    <td className="p-4">{lead.nature_of_business}</td>
                    <td className="p-4">{lead.state}</td>
                    <td className="p-4">{lead.status}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => viewRawPayload(lead)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-10">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}