async function loadLeads() {
  const res = await fetch('/api/leads');
  const leads = await res.json();
  
  const tbody = document.querySelector('#leadsTable tbody');
  tbody.innerHTML = '';

  leads.forEach(lead => {
    const row = `
      <tr>
        <td>${new Date(lead.submittedAt).toLocaleString()}</td>
        <td>${lead.applicant_name}</td>
        <td>${lead.mobile}</td>
        <td>${lead.email}</td>
        <td>${lead.nature_of_business}</td>
        <td>${lead.state}</td>
        <td><span class="badge bg-${lead.status === 'new' ? 'primary' : 'success'}">${lead.status}</span></td>
        <td><button class="btn btn-sm btn-info" onclick="viewDetails('${lead._id}')">View</button></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

async function viewDetails(id) {
  const res = await fetch(`/api/lead/${id}`);
  const lead = await res.json();
  alert(JSON.stringify(lead.rawPayload, null, 2));
}

window.onload = loadLeads;