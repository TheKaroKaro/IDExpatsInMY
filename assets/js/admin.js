// Admin functionality (to be loaded only on admin pages)
class AdminPanel {
    constructor() {
        this.pendingSubmissions = [];
        this.publishedContacts = [];
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
    }
    
    async loadData() {
        // In production, load from:
        // 1. Netlify Forms API
        // 2. GitHub repository
        // 3. Your backend
        
        // Sample data for demo
        this.pendingSubmissions = [
            {
                id: 'sub_001',
                formData: {
                    serviceName: "Jastip Surabaya-KL",
                    category: "jastip",
                    phone: "+60123456789",
                    description: "Weekly jastip from Surabaya"
                },
                submittedAt: new Date().toISOString(),
                status: "pending"
            }
        ];
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Approve/Reject buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('approve-btn')) {
                this.approveSubmission(e.target.dataset.id);
            }
            if (e.target.classList.contains('reject-btn')) {
                this.rejectSubmission(e.target.dataset.id);
            }
        });
    }
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
    }
    
    async approveSubmission(submissionId) {
        if (confirm('Approve and publish this contact?')) {
            const submission = this.pendingSubmissions.find(s => s.id === submissionId);
            
            // Create markdown file
            const markdown = this.generateMarkdown(submission.formData);
            
            // Push to GitHub (you would implement this)
            await this.pushToGitHub(markdown, submission.formData);
            
            // Remove from pending
            this.pendingSubmissions = this.pendingSubmissions.filter(s => s.id !== submissionId);
            
            // Update UI
            this.renderPendingSubmissions();
            alert('Contact published successfully!');
        }
    }
    
    generateMarkdown(formData) {
        return `---
title: "${formData.serviceName}"
category: "${formData.category}"
phone: "${formData.phone}"
date_added: "${new Date().toISOString().split('T')[0]}"
---

${formData.description}
`;
    }
    
    async pushToGitHub(content, formData) {
        // Implementation would use GitHub API
        // const response = await fetch('https://api.github.com/...', {
        //     method: 'POST',
        //     headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
        //     body: JSON.stringify({
        //         message: `Add contact: ${formData.serviceName}`,
        //         content: btoa(content)
        //     })
        // });
        console.log('Would push to GitHub:', content);
    }
    
    renderDashboard() {
        document.getElementById('pending-count').textContent = this.pendingSubmissions.length;
        this.renderPendingSubmissions();
    }
    
    renderPendingSubmissions() {
        const container = document.getElementById('pending-submissions');
        if (!container) return;
        
        if (this.pendingSubmissions.length === 0) {
            container.innerHTML = '<p class="empty-state">No pending submissions</p>';
            return;
        }
        
        container.innerHTML = this.pendingSubmissions.map(submission => `
            <div class="submission-card">
                <h3>${submission.formData.serviceName}</h3>
                <p><strong>Category:</strong> ${submission.formData.category}</p>
                <p><strong>Phone:</strong> ${submission.formData.phone}</p>
                <p>${submission.formData.description}</p>
                <div class="action-buttons">
                    <button class="btn approve-btn" data-id="${submission.id}">Approve</button>
                    <button class="btn reject-btn" data-id="${submission.id}">Reject</button>
                </div>
            </div>
        `).join('');
    }
}

// Initialize admin panel
if (window.location.pathname.includes('/admin')) {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminPanel();
    });
}