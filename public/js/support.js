// Initialize Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

document.addEventListener('DOMContentLoaded', () => {
    const supportForm = document.getElementById('supportForm');
    const submitBtn = document.getElementById('submitBtn');
    const buttonText = submitBtn.querySelector('.button-text');
    const buttonLoader = submitBtn.querySelector('.button-loader');
    const successMessage = document.getElementById('successMessage');
    
    // Auto-fill user data if logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('email').value = user.email || '';
            document.getElementById('name').value = user.displayName || '';
        }
    });

    // Handle form submission
    supportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        submitBtn.disabled = true;
        buttonText.textContent = 'Mengirim...';
        buttonLoader.style.display = 'inline-block';
        
        try {
            const supportData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim(),
                status: 'new',
                createdAt: serverTimestamp(),
                userId: auth.currentUser ? auth.currentUser.uid : 'anonymous',
                resolved: false
            };
            
            // Add to Firestore
            await db.collection('supportTickets').add(supportData);
            
            // Show success message
            supportForm.style.display = 'none';
            successMessage.style.display = 'block';
            
        } catch (error) {
            console.error('Error submitting support ticket:', error);
            alert('Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.');
            
            // Reset button state
            submitBtn.disabled = false;
            buttonText.textContent = 'Kirim Pesan';
            buttonLoader.style.display = 'none';
        }
    });
});
