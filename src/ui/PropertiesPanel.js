// Properties Panel - UI for editing component properties
class PropertiesPanel {
    constructor() {
        this.panel = null;
        this.currentComponent = null;
        this.createPanel();
    }

    createPanel() {
        // Create panel HTML
        this.panel = document.createElement('div');
        this.panel.id = 'properties-panel';
        this.panel.className = 'properties-panel hidden';
        this.panel.innerHTML = `
            <div class="properties-header">
                <h3>Properties</h3>
                <button id="properties-close" class="close-btn">×</button>
            </div>
            <div class="properties-content">
                <p class="no-selection">No component selected</p>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // Close button
        document.getElementById('properties-close').addEventListener('click', () => {
            this.hide();
        });
    }

    show(component) {
        this.currentComponent = component;
        this.panel.classList.remove('hidden');
        this.render();
    }

    hide() {
        this.panel.classList.add('hidden');
        this.currentComponent = null;
    }

    toggle(component) {
        if (this.currentComponent === component && !this.panel.classList.contains('hidden')) {
            this.hide();
        } else {
            this.show(component);
        }
    }

    render() {
        const content = this.panel.querySelector('.properties-content');
        
        if (!this.currentComponent) {
            content.innerHTML = '<p class="no-selection">No component selected</p>';
            return;
        }

        const def = this.currentComponent.definition;
        const properties = def.properties || {};
        
        if (Object.keys(properties).length === 0) {
            content.innerHTML = `
                <div class="component-info">
                    <strong>${def.name}</strong>
                    <p>${def.description}</p>
                    <p class="no-properties">No configurable properties</p>
                </div>
            `;
            return;
        }

        // Build property editor UI
        let html = `
            <div class="component-info">
                <strong>${def.name}</strong>
                <p>${def.description}</p>
            </div>
            <div class="properties-form">
        `;

        for (const [key, propDef] of Object.entries(properties)) {
            const value = this.currentComponent.getProperty(key);
            html += this.renderPropertyField(key, propDef, value);
        }

        html += '</div>';
        content.innerHTML = html;

        // Add event listeners
        this.attachEventListeners();
    }

    renderPropertyField(key, propDef, value) {
        const { type, label, min, max, options, unit } = propDef;
        
        let html = `<div class="property-field">`;
        html += `<label>${label || key}${unit ? ` (${unit})` : ''}:</label>`;

        switch (type) {
            case 'number':
                html += `<input type="number" 
                    data-property="${key}" 
                    value="${value}" 
                    ${min !== undefined ? `min="${min}"` : ''} 
                    ${max !== undefined ? `max="${max}"` : ''}>`;
                break;

            case 'boolean':
                html += `<input type="checkbox" 
                    data-property="${key}" 
                    ${value ? 'checked' : ''}>`;
                break;

            case 'select':
                html += `<select data-property="${key}">`;
                for (const opt of options) {
                    const selected = opt.value === value ? 'selected' : '';
                    html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                }
                html += `</select>`;
                break;

            case 'text':
                html += `<input type="text" 
                    data-property="${key}" 
                    value="${value}">`;
                break;

            case 'memory':
                html += `<button data-property="${key}" class="memory-edit-btn">Edit Memory</button>`;
                break;

            default:
                html += `<input type="text" 
                    data-property="${key}" 
                    value="${value}">`;
        }

        html += `</div>`;
        return html;
    }

    attachEventListeners() {
        const inputs = this.panel.querySelectorAll('[data-property]');
        
        inputs.forEach(input => {
            const property = input.getAttribute('data-property');
            
            if (input.classList.contains('memory-edit-btn')) {
                input.addEventListener('click', () => {
                    this.openMemoryEditor(property);
                });
            } else if (input.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    this.updateProperty(property, e.target.checked);
                });
            } else {
                input.addEventListener('change', (e) => {
                    let value = e.target.value;
                    
                    // Convert to number if needed
                    if (input.type === 'number') {
                        value = parseFloat(value);
                        if (isNaN(value)) value = 0;
                    }
                    
                    this.updateProperty(property, value);
                });
            }
        });
    }

    updateProperty(key, value) {
        if (this.currentComponent) {
            this.currentComponent.setProperty(key, value);
        }
    }

    openMemoryEditor(property) {
        // TODO: Implement memory editor modal
        alert('Memory editor not yet implemented. You can edit the memory array in the component state directly.');
    }
}
