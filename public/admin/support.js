// Import Firebase services
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  orderBy, 
  limit, 
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { auth, db } from '../firebase.js';

// DOM Elements
const ticketsTableBody = document.getElementById('ticketsTableBody');
const ticketModal = document.getElementById('ticketModal');
const closeModalBtn = document.querySelector('.close-modal');
const markResolvedBtn = document.getElementById('markResolved');
const refreshTicketsBtn = document.getElementById('refreshTickets');

// Global Variables
let currentTicket = null;
const pageSize = 10;
let lastTicketVisible = null;

// Support Tickets Management

// Load support tickets
async function loadSupportTickets() {
  try {
    showLoading(true, 'supportSection');
    console.log('Loading support tickets...');
    
    // Use the same collection name as in your form submission
    const ticketsRef = collection(db, 'support');
    console.log('Querying collection: support');
    
    const q = query(
      ticketsRef, 
      orderBy('createdAt', 'desc')
    );
    
    console.log('Query created, executing...');
    
    const querySnapshot = await getDocs(q);
    console.log('Found', querySnapshot.size, 'tickets');
    
    ticketsTableBody.innerHTML = '';
    
    if (querySnapshot.empty) {
      console.log('No support tickets found');
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">Tidak ada tiket dukungan</td>
        </tr>
      `;
      return;
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamp to Date if needed
      const ticket = { 
        id: doc.id, 
        ...data,
        // Convert Firestore timestamp to Date
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      };
      console.log('Adding ticket to table:', ticket);
      addTicketToTable(ticket);
    });
    
  } catch (error) {
    console.error('Error loading support tickets:', error);
    showError('Gagal memuat tiket dukungan: ' + error.message);
  } finally {
    showLoading(false, 'supportSection');
  }
}

// Add ticket to table
function addTicketToTable(ticket) {
  const row = document.createElement('tr');
  let formattedDate = 'N/A';
  
  // Handle different date formats
  if (ticket.createdAt) {
    if (ticket.createdAt.toDate) {
      // It's a Firestore timestamp
      formattedDate = formatDate(ticket.createdAt.toDate());
    } else if (ticket.createdAt instanceof Date) {
      // It's already a Date object
      formattedDate = formatDate(ticket.createdAt);
    } else if (typeof ticket.createdAt === 'string') {
      // It's an ISO string
      formattedDate = formatDate(new Date(ticket.createdAt));
    }
  }
  
  row.innerHTML = `
    <td>${ticket.name || 'N/A'}</td>
    <td>${ticket.email || 'N/A'}</td>
    <td>${ticket.subject || 'Tidak ada subjek'}</td>
    <td>
      <span class="status-badge status-${ticket.status || 'new'}">
        ${formatStatus(ticket.status || 'new')}
      </span>
    </td>
    <td>${formattedDate}</td>
    <td>
      <button class="btn btn-small btn-primary" onclick="viewTicket('${ticket.id}')">
        <i class="fas fa-eye"></i> Lihat
      </button>
    </td>
  `;
  
  ticketsTableBody.appendChild(row);
}

// View ticket details
async function viewTicket(ticketId) {
  try {
    console.log('Viewing ticket:', ticketId);
    const ticketDoc = await getDoc(doc(db, 'support', ticketId));
    
    if (!ticketDoc.exists()) {
      throw new Error('Tiket tidak ditemukan');
    }
    
    const ticket = { id: ticketDoc.id, ...ticketDoc.data() };
    currentTicket = ticket;
    
    // Format the date
    let formattedDate = 'N/A';
    if (ticket.createdAt) {
      const date = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      formattedDate = date.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Update modal with ticket data
    document.getElementById('ticketSubject').textContent = ticket.subject || 'Tidak ada subjek';
    document.getElementById('ticketFrom').textContent = ticket.name || 'N/A';
    document.getElementById('ticketEmail').textContent = ticket.email || 'N/A';
    document.getElementById('ticketDate').textContent = formattedDate;
    document.getElementById('ticketMessage').textContent = ticket.message || 'Tidak ada pesan';
    
    // Update status badge
    const statusBadge = document.getElementById('ticketStatus');
    if (statusBadge) {
      statusBadge.className = `status-badge status-${ticket.status || 'new'}`;
      statusBadge.textContent = formatStatus(ticket.status || 'new');
    }
    document.getElementById('ticketStatus').textContent = formatStatus(ticket.status || 'new');
    document.getElementById('ticketStatus').className = `status-badge status-${ticket.status || 'new'}`;
    document.getElementById('ticketMessage').textContent = ticket.message || 'Tidak ada pesan';
    
    // Update button state
    const markResolvedBtn = document.getElementById('markResolved');
    if (markResolvedBtn) {
      markResolvedBtn.disabled = ticket.status === 'resolved';
      markResolvedBtn.textContent = ticket.status === 'resolved' ? 'Sudah Direspon' : 'Tandai Selesai';
    }
    
    // Show modal
    openModal();
    
  } catch (error) {
    console.error('Error viewing ticket:', error);
    showError('Gagal memuat detail tiket');
  } finally {
    showLoading(false);
  }
};

// Mark ticket as resolved
async function markTicketAsResolved() {
  if (!currentTicket) return;
  
  try {
    const confirmResolve = confirm('Apakah Anda yakin ingin menandai tiket ini sebagai selesai?');
    if (!confirmResolve) return;
    
    const ticketRef = doc(db, 'support', currentTicket.id);
    await updateDoc(ticketRef, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Update UI
    document.getElementById('ticketStatus').textContent = 'Selesai';
    document.getElementById('ticketStatus').className = 'status-badge status-resolved';
    document.getElementById('markResolved').disabled = true;
    document.getElementById('markResolved').textContent = 'Sudah Direspon';
    
    // Reload tickets list
    loadSupportTickets();
    
  } catch (error) {
    console.error('Error resolving ticket:', error);
    showError('Gagal memperbarui status tiket');
  } finally {
    showLoading(false);
  }
}

// Open modal
function openModal() {
  if (ticketModal) {
    ticketModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

// Close modal
function closeModal() {
  if (ticketModal) {
    ticketModal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Format status text
function formatStatus(status) {
  const statusMap = {
    'new': 'Baru',
    'pending': 'Menunggu',
    'resolved': 'Selesai'
  };
  return statusMap[status] || status;
}

// Format date
function formatDate(date) {
  if (!(date instanceof Date)) return 'N/A';
  
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show loading state
function showLoading(show, sectionId = '') {
  const loader = sectionId 
    ? document.querySelector(`#${sectionId} .loading`)
    : document.querySelector('.loading');
    
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

// Show error message
function showError(message) {
  alert('Error: ' + message);
}

// Make viewTicket function globally available
window.viewTicket = viewTicket;

// Initialize support tickets when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  const markResolvedBtn = document.getElementById('markResolved');
  const refreshTicketsBtn = document.getElementById('refreshTickets');
  const closeModalBtn = document.querySelector('.close-modal');
  const closeModalBtn2 = document.querySelector('.close-modal-btn');
  
  if (markResolvedBtn) {
    markResolvedBtn.addEventListener('click', markTicketAsResolved);
  }
  
  if (refreshTicketsBtn) {
    refreshTicketsBtn.addEventListener('click', loadSupportTickets);
  }
  
  // Close modal when clicking the X button or close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (closeModalBtn2) {
    closeModalBtn2.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('ticketModal');
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Initial load
  loadSupportTickets();
});

// Export functions that need to be used in other modules
export { loadSupportTickets, viewTicket, markTicketAsResolved };
