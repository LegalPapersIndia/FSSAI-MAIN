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

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Leads fetched:", data);   // ← Debugging ke liye
      setLeads(data);
    } catch (error) {
      console.error('Fetch Error:', error);
      alert("Backend se connect nahi ho pa raha. Please check server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    navigate('/admin');
  };

  // ✅ Improved Filter with fallback (rawPayload ke liye bhi safe)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = searchTerm.toLowerCase();

      // Safe fallback - agar clean field nahi hai to rawPayload se lo
      const applicantName = (lead.applicant_name || 
                           lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtName'] || 
                           lead.rawPayload?.applicant_name || '').toLowerCase();

      const mobileNo = lead.mobile || 
                      lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtPhone1'] || 
                      lead.rawPayload?.mobile || '';

      const emailId = (lead.email || 
                      lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtEmail'] || 
                      lead.rawPayload?.email || '').toLowerCase();

      const business = lead.nature_of_business || 
                      lead.rawPayload?.nature_of_business || '';

      const stateName = lead.state || 
                       lead.rawPayload?.state || '';

      const matchesSearch = 
        applicantName.includes(searchLower) ||
        mobileNo.includes(searchTerm) ||
        emailId.includes(searchLower);

      const matchesStatus = 
        filterStatus === 'all' || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, filterStatus]);

  // ✅ Export Excel with fallback
  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert("No data to export");
      return;
    }

    const data = filteredLeads.map((lead) => ({
      "Date & Time": new Date(lead.submittedAt || lead.createdAt).toLocaleString(),
      "Applicant Name": lead.applicant_name || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtName'] || '-',
      "Mobile": lead.mobile || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtPhone1'] || '-',
      "Email": lead.email || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtEmail'] || '-',
      "Business": lead.nature_of_business || '-',
      "State": lead.state || '-',
      "Status": lead.status || 'new',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FSSAI_Leads");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });

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
            <button onClick={fetchLeads} className="bg-green-600 text-white px-6 py-3 rounded-2xl">
              🔄 Refresh
            </button>

            <button onClick={exportToExcel} className="bg-blue-600 text-white px-6 py-3 rounded-2xl">
              📥 Export Excel
            </button>

            <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-3 rounded-2xl">
              Logout
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search by name, mobile or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border rounded-xl flex-1"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-3 border rounded-xl"
          >
            <option value="all">All Status</option>
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
                <th className="p-4 text-left">Applicant Name</th>
                <th className="p-4 text-left">Mobile</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Nature of Business</th>
                <th className="p-4 text-left">State</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {new Date(lead.submittedAt || lead.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">
                      {lead.applicant_name || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtName'] || '-'}
                    </td>
                    <td className="p-4">
                      {lead.mobile || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtPhone1'] || '-'}
                    </td>
                    <td className="p-4">
                      {lead.email || lead.rawPayload?.['ctl00$ContentPlaceHolder1$txtEmail'] || '-'}
                    </td>
                    <td className="p-4">
                      {lead.nature_of_business || '-'}
                    </td>
                    <td className="p-4">
                      {lead.state || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {lead.status || 'new'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => viewRawPayload(lead)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm"
                      >
                        View Raw
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-12 text-gray-500">
                    No leads found. Submit a form from frontend to see data here.
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