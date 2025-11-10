// Modal utility for prompts and confirmations
class Modal {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.title = document.getElementById('modal-title');
        this.message = document.getElementById('modal-message');
        this.input = document.getElementById('modal-input');
        this.cancelBtn = document.getElementById('modal-cancel');
        this.confirmBtn = document.getElementById('modal-confirm');
        
        this.resolveCallback = null;
        
        // Event listeners
        this.cancelBtn.addEventListener('click', () => this.close(false));
        this.confirmBtn.addEventListener('click', () => this.confirm());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close(false);
            }
        });
        
        // Handle Enter key
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirm();
            } else if (e.key === 'Escape') {
                this.close(false);
            }
        });
    }
    
    show(options = {}) {
        const {
            title = 'Confirm',
            message = '',
            type = 'confirm', // 'confirm' or 'prompt'
            defaultValue = '',
            confirmText = 'OK',
            cancelText = 'Cancel'
        } = options;
        
        this.title.textContent = title;
        this.message.textContent = message;
        this.confirmBtn.textContent = confirmText;
        this.cancelBtn.textContent = cancelText;
        
        if (type === 'prompt') {
            this.input.style.display = 'block';
            this.input.value = defaultValue;
            setTimeout(() => {
                this.input.focus();
                this.input.select();
            }, 100);
        } else {
            this.input.style.display = 'none';
            setTimeout(() => this.confirmBtn.focus(), 100);
        }
        
        this.overlay.classList.add('active');
        
        return new Promise((resolve) => {
            this.resolveCallback = resolve;
        });
    }
    
    confirm() {
        const value = this.input.style.display === 'none' ? true : this.input.value;
        this.close(value);
    }
    
    close(result) {
        this.overlay.classList.remove('active');
        if (this.resolveCallback) {
            this.resolveCallback(result);
            this.resolveCallback = null;
        }
    }
    
    // Convenience methods
    async showAlert(message, title = 'Alert') {
        this.cancelBtn.style.display = 'none';
        const result = await this.show({
            title,
            message,
            type: 'confirm',
            confirmText: 'OK'
        });
        this.cancelBtn.style.display = '';
        return result;
    }
    
    async showConfirm(message, title = 'Confirm') {
        return this.show({
            title,
            message,
            type: 'confirm'
        });
    }
    
    async showPrompt(message, title = 'Input', defaultValue = '') {
        return this.show({
            title,
            message,
            type: 'prompt',
            defaultValue
        });
    }
}
