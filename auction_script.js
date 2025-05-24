// Auction System JavaScript

class AuctionSystem {
    constructor() {
        this.auctions = [];
        this.currentAuctionId = null;
        this.timers = new Map();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAuctions();
        this.renderAuctions();
        this.startTimers();
    }

    bindEvents() {
        // Auction creation form
        document.getElementById('auctionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAuction();
        });

        // Bid form
        document.getElementById('bidForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.placeBid();
        });

        // Modal close events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('bidModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    createAuction() {
        const name = document.getElementById('itemName').value.trim();
        const description = document.getElementById('itemDescription').value.trim();
        const startingPrice = parseFloat(document.getElementById('startingPrice').value);
        const duration = parseInt(document.getElementById('duration').value);

        if (!name || startingPrice <= 0 || duration <= 0) {
            alert('Please fill in all required fields with valid values.');
            return;
        }

        const auction = {
            id: Date.now(),
            name,
            description,
            startingPrice,
            currentPrice: startingPrice,
            duration: duration * 60 * 1000, // Convert to milliseconds
            startTime: Date.now(),
            endTime: Date.now() + (duration * 60 * 1000),
            bids: [],
            status: 'active',
            winner: null
        };

        this.auctions.push(auction);
        this.saveAuctions();
        this.renderAuctions();
        this.startTimer(auction.id);

        // Reset form
        document.getElementById('auctionForm').reset();
        
        // Show success message
        this.showNotification('Auction created successfully!', 'success');
    }

    placeBid() {
        const bidderName = document.getElementById('bidderName').value.trim();
        const bidAmount = parseFloat(document.getElementById('bidAmount').value);
        
        if (!bidderName || bidAmount <= 0) {
            alert('Please enter a valid name and bid amount.');
            return;
        }

        const auction = this.auctions.find(a => a.id === this.currentAuctionId);
        if (!auction || auction.status !== 'active') {
            alert('This auction is no longer active.');
            this.closeModal();
            return;
        }

        const minimumBid = auction.currentPrice + 0.01;
        if (bidAmount < minimumBid) {
            alert(`Bid must be at least $${minimumBid.toFixed(2)}`);
            return;
        }

        // Check if this is the same bidder trying to outbid themselves
        const lastBid = auction.bids[auction.bids.length - 1];
        if (lastBid && lastBid.bidder === bidderName) {
            alert('You are already the highest bidder!');
            return;
        }

        const bid = {
            bidder: bidderName,
            amount: bidAmount,
            timestamp: Date.now()
        };

        auction.bids.push(bid);
        auction.currentPrice = bidAmount;
        auction.highestBidder = bidderName;

        this.saveAuctions();
        this.renderAuctions();
        this.closeModal();

        // Show success message
        this.showNotification(`Bid placed successfully! You are now the highest bidder at $${bidAmount.toFixed(2)}`, 'success');
    }

    openBidModal(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction || auction.status !== 'active') {
            alert('This auction is no longer active.');
            return;
        }

        this.currentAuctionId = auctionId;
        document.getElementById('currentBidAmount').textContent = auction.currentPrice.toFixed(2);
        document.getElementById('minimumBid').textContent = (auction.currentPrice + 0.01).toFixed(2);
        document.getElementById('bidAmount').min = (auction.currentPrice + 0.01).toFixed(2);
        document.getElementById('bidModal').style.display = 'block';
        
        // Clear previous values
        document.getElementById('bidderName').value = '';
        document.getElementById('bidAmount').value = '';
        document.getElementById('bidderName').focus();
    }

    closeModal() {
        document.getElementById('bidModal').style.display = 'none';
        this.currentAuctionId = null;
    }

    renderAuctions() {
        const activeAuctions = this.auctions.filter(a => a.status === 'active');
        const completedAuctions = this.auctions.filter(a => a.status !== 'active');

        this.renderAuctionList(activeAuctions, 'auctionsList', true);
        this.renderAuctionList(completedAuctions, 'completedAuctionsList', false);
    }

    renderAuctionList(auctions, containerId, isActive) {
        const container = document.getElementById(containerId);
        
        if (auctions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No ${isActive ? 'active' : 'completed'} auctions</h3>
                    <p>${isActive ? 'Create your first auction above!' : 'Completed auctions will appear here.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = auctions.map(auction => this.renderAuctionCard(auction, isActive)).join('');
    }

    renderAuctionCard(auction, isActive) {
        const timeRemaining = isActive ? this.getTimeRemaining(auction.endTime) : 'Ended';
        const statusClass = auction.status === 'active' ? 'status-active' : 
                           auction.status === 'completed' ? 'status-completed' : 'status-expired';
        
        const winnerBadge = auction.winner ? `<span class="winner-badge">🏆 Winner</span>` : '';
        const cardClass = auction.winner ? 'winner-highlight' : '';

        const bidsHtml = auction.bids.length > 0 ? `
            <div class="bid-history">
                <h4>Recent Bids (${auction.bids.length} total)</h4>
                ${auction.bids.slice(-3).reverse().map(bid => `
                    <div class="bid-item">
                        <span class="bidder-name">${this.escapeHtml(bid.bidder)}${bid.bidder === auction.highestBidder ? winnerBadge : ''}</span>
                        <span class="bid-amount">$${bid.amount.toFixed(2)}</span>
                        <span class="bid-time">${this.formatTime(bid.timestamp)}</span>
                    </div>
                `).join('')}
            </div>
        ` : '<p class="no-bids">No bids yet</p>';

        return `
            <div class="auction-card ${cardClass}">
                <div class="auction-header">
                    <h3 class="auction-title">${this.escapeHtml(auction.name)}</h3>
                    <span class="auction-status ${statusClass}">${auction.status}</span>
                </div>
                ${auction.description ? `<p class="auction-description">${this.escapeHtml(auction.description)}</p>` : ''}
                
                <div class="auction-details">
                    <div class="detail-item">
                        <div class="detail-label">Starting Price</div>
                        <div class="detail-value">$${auction.startingPrice.toFixed(2)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Current Price</div>
                        <div class="detail-value current-price">$${auction.currentPrice.toFixed(2)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Time ${isActive ? 'Remaining' : 'Ended'}</div>
                        <div class="detail-value timer ${timeRemaining.includes('minute') || timeRemaining.includes('second') ? 'urgent' : ''}" 
                             data-auction-id="${auction.id}">
                            ${timeRemaining}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total Bids</div>
                        <div class="detail-value">${auction.bids.length}</div>
                    </div>
                </div>

                ${bidsHtml}

                ${isActive ? `
                    <button class="bid-button" onclick="auctionSystem.openBidModal(${auction.id})">
                        Place Bid
                    </button>
                ` : ''}
            </div>
        `;
    }

    startTimers() {
        this.auctions.forEach(auction => {
            if (auction.status === 'active') {
                this.startTimer(auction.id);
            }
        });
    }

    startTimer(auctionId) {
        // Clear existing timer if any
        if (this.timers.has(auctionId)) {
            clearInterval(this.timers.get(auctionId));
        }

        const timer = setInterval(() => {
            const auction = this.auctions.find(a => a.id === auctionId);
            if (!auction) {
                clearInterval(timer);
                this.timers.delete(auctionId);
                return;
            }

            const now = Date.now();
            if (now >= auction.endTime) {
                this.endAuction(auctionId);
                clearInterval(timer);
                this.timers.delete(auctionId);
                return;
            }

            // Update timer display
            const timerElement = document.querySelector(`[data-auction-id="${auctionId}"]`);
            if (timerElement) {
                const timeRemaining = this.getTimeRemaining(auction.endTime);
                timerElement.textContent = timeRemaining;
                
                // Add urgent class if less than 5 minutes remaining
                const remaining = auction.endTime - now;
                if (remaining < 5 * 60 * 1000) {
                    timerElement.classList.add('urgent');
                }
            }
        }, 1000);

        this.timers.set(auctionId, timer);
    }

    endAuction(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction) return;

        auction.status = 'completed';
        
        if (auction.bids.length > 0) {
            const highestBid = auction.bids[auction.bids.length - 1];
            auction.winner = highestBid.bidder;
            auction.finalPrice = highestBid.amount;
            
            this.showNotification(
                `Auction "${auction.name}" has ended! Winner: ${auction.winner} with $${auction.finalPrice.toFixed(2)}`,
                'info'
            );
        } else {
            auction.status = 'expired';
            this.showNotification(`Auction "${auction.name}" has expired with no bids.`, 'warning');
        }

        this.saveAuctions();
        this.renderAuctions();
    }

    getTimeRemaining(endTime) {
        const now = Date.now();
        const remaining = endTime - now;

        if (remaining <= 0) {
            return 'Ended';
        }

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1001',
            maxWidth: '400px',
            wordWrap: 'break-word',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#48bb78' : 
                           type === 'warning' ? '#ed8936' :
                           type === 'error' ? '#e53e3e' : '#4299e1'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    saveAuctions() {
        // In a real application, this would save to a backend
        // For demo purposes, we'll use localStorage
        try {
            localStorage.setItem('auctions', JSON.stringify(this.auctions));
        } catch (e) {
            console.log('Storage not available, running in memory only');
        }
    }

    loadAuctions() {
        try {
            const saved = localStorage.getItem('auctions');
            if (saved) {
                this.auctions = JSON.parse(saved);
                // Check for expired auctions on load
                this.auctions.forEach(auction => {
                    if (auction.status === 'active' && Date.now() >= auction.endTime) {
                        this.endAuction(auction.id);
                    }
                });
            }
        } catch (e) {
            console.log('Could not load saved auctions');
            this.auctions = [];
        }
    }

    // Method to clear all auctions (for testing)
    clearAllAuctions() {
        if (confirm('Are you sure you want to clear all auctions? This cannot be undone.')) {
            this.auctions = [];
            this.timers.forEach(timer => clearInterval(timer));
            this.timers.clear();
            this.saveAuctions();
            this.renderAuctions();
            this.showNotification('All auctions cleared!', 'info');
        }
    }
}

// Initialize the auction system when the page loads
let auctionSystem;
document.addEventListener('DOMContentLoaded', () => {
    auctionSystem = new AuctionSystem();
    
    // Add a clear all button for testing (remove in production)
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Clear All Auctions (Debug)';
    debugButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #e53e3e;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        z-index: 1000;
    `;
    debugButton.onclick = () => auctionSystem.clearAllAuctions();
    document.body.appendChild(debugButton);
});