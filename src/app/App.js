// Main application class
class App {
    constructor() {
        this.circuits = new Map();
        this.currentCircuitName = 'main';
        this.circuits.set('main', new Circuit('Main Circuit'));
        
        this.canvas = document.getElementById('canvas');
        this.renderer = new Renderer(this.canvas);
        this.simulator = new Simulator(this.getCurrentCircuit());
        this.interactionManager = new InteractionManager(
            this.canvas,
            this.renderer,
            this.getCurrentCircuit(),
            this.simulator,
            this // Pass app reference
        );

        // Initialize asynchronously
        this.init();
    }

    async init() {
        // Initialize component registry from JSON
        this.componentRegistry = new ComponentRegistry();
        await this.componentRegistry.init();
        
        // Initialize modal
        this.modal = new Modal();
        
        // Initialize properties panel
        this.propertiesPanel = new PropertiesPanel();
        
        this.setupUI();
        this.buildPalette(); // Build palette from registry
        this.buildCircuitsList(); // Build circuits list
        this.updateSimulationUI(false); // Initialize UI state
        this.updateCircuitButtons(); // Initialize circuit button states
        this.startRenderLoop();
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderer.resize();
            }, 100);
        });
        
        // Also use ResizeObserver for the canvas container
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.renderer.resize();
            });
            resizeObserver.observe(this.canvas.parentElement);
        }
    }

    getCurrentCircuit() {
        return this.circuits.get(this.currentCircuitName);
    }

    // Build component palette from registry
    buildPalette(searchQuery = '') {
        const paletteContent = document.getElementById('palette-content');
        paletteContent.innerHTML = '';

        // Get all categories (excluding Subcircuits from registry)
        const categories = this.componentRegistry.getAllCategories().filter(cat => cat !== 'Subcircuits');
        
        const query = searchQuery.toLowerCase().trim();
        
        categories.forEach(categoryName => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'palette-category';
            
            const header = document.createElement('h4');
            header.textContent = categoryName;
            categoryDiv.appendChild(header);
            
            const components = this.componentRegistry.getCategory(categoryName);
            let visibleCount = 0;
            
            components.forEach(comp => {
                // Filter by search query
                if (query && !comp.name.toLowerCase().includes(query) && 
                    !comp.description.toLowerCase().includes(query)) {
                    return;
                }
                
                visibleCount++;
                
                const item = document.createElement('div');
                item.className = 'component-item';
                item.setAttribute('data-type', comp.id);
                item.setAttribute('draggable', 'true');
                item.setAttribute('title', comp.description);
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = comp.name;
                nameSpan.style.cssText = 'flex: 1;';
                item.appendChild(nameSpan);
                
                // Add drag event
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('componentType', comp.id);
                });
                
                categoryDiv.appendChild(item);
            });
            
            // Only add category if it has visible components
            if (visibleCount > 0) {
                paletteContent.appendChild(categoryDiv);
            }
        });
        
        // Show message if no components found
        if (query && paletteContent.children.length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = 'text-align: center; color: #858585; padding: 20px; font-size: 13px;';
            noResults.textContent = 'No components found';
            paletteContent.appendChild(noResults);
        }
    }

    buildCircuitsList(searchQuery = '') {
        const circuitsContent = document.getElementById('circuits-content');
        circuitsContent.innerHTML = '';

        const query = searchQuery.toLowerCase().trim();
        
        // Get all subcircuits (exclude main circuit)
        const subcircuits = Array.from(this.circuits.entries())
            .filter(([name, circuit]) => circuit.isSubcircuit && name !== 'main');
        
        // Filter by query if provided
        const filteredSubcircuits = query 
            ? subcircuits.filter(([name]) => name.toLowerCase().includes(query))
            : subcircuits;
        
        if (filteredSubcircuits.length === 0) {
            const noCircuits = document.createElement('div');
            noCircuits.style.cssText = 'text-align: center; color: #858585; padding: 20px; font-size: 13px;';
            noCircuits.textContent = query ? 'No circuits found' : 'No subcircuits yet';
            circuitsContent.appendChild(noCircuits);
            return;
        }
        
        filteredSubcircuits.forEach(([name, circuit]) => {
            const item = document.createElement('div');
            item.className = 'component-item';
            item.setAttribute('data-type', 'SUBCIRCUIT_' + name);
            item.setAttribute('draggable', 'true');
            item.setAttribute('title', `Subcircuit: ${name}`);
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            nameSpan.style.cssText = 'flex: 1;';
            item.appendChild(nameSpan);
            
            // Add drag event
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('componentType', 'SUBCIRCUIT_' + name);
            });
            
            circuitsContent.appendChild(item);
        });
    }

    // Component factory for deserialization
    createComponent(type, x, y, circuitName = null) {
        // Check if it's a subcircuit
        if (type.startsWith('SUBCIRCUIT_')) {
            const subcircuitName = circuitName || type.substring('SUBCIRCUIT_'.length);
            const circuitInstance = this.circuits.get(subcircuitName);
            return new SubcircuitComponent(x, y, subcircuitName, circuitInstance);
        }
        
        // Use registry to create component
        const component = this.componentRegistry.create(type, x, y);
        return component;
    }

    setupUI() {
        // Simulate button
        document.getElementById('btn-simulate').addEventListener('click', () => {
            // Deselect all components
            this.getCurrentCircuit().components.forEach(comp => comp.selected = false);
            this.interactionManager.draggedComponent = null;
            
            this.simulator.evaluate(); // Evaluate once before starting
            this.simulator.start();
            this.updateStatus('Simulating...');
            this.updateSimulationUI(true);
        });

        // Stop button
        document.getElementById('btn-stop').addEventListener('click', () => {
            this.simulator.stop();
            this.simulator.evaluate(); // Re-evaluate to update disconnected components
            this.updateStatus('Stopped');
            this.updateSimulationUI(false);
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.simulator.reset();
            this.updateStatus('Circuit reset');
        });

        // Save button
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveProject();
        });

        // Load button
        document.getElementById('btn-load').addEventListener('click', () => {
            this.loadProject();
        });

        // Import subcircuit button
        document.getElementById('btn-import-subcircuit').addEventListener('click', () => {
            this.importSubcircuit();
        });

        // New circuit button
        document.getElementById('btn-new-circuit').addEventListener('click', async () => {
            const name = await this.modal.showPrompt('Enter circuit name:', 'New Circuit');
            if (name && !this.circuits.has(name)) {
                this.createNewCircuit(name);
            }
        });

        // Export circuit button
        document.getElementById('btn-export-circuit').addEventListener('click', () => {
            this.exportCurrentCircuit();
        });

        // Delete circuit button
        document.getElementById('btn-delete-circuit').addEventListener('click', () => {
            this.deleteCurrentCircuit();
        });

        // Circuit selector
        document.getElementById('circuit-select').addEventListener('change', (e) => {
            this.switchCircuit(e.target.value);
        });

        // Component search
        document.getElementById('component-search').addEventListener('input', (e) => {
            this.buildPalette(e.target.value);
        });

        // Circuit search
        document.getElementById('circuit-search').addEventListener('input', (e) => {
            this.buildCircuitsList(e.target.value);
        });

        // Palette tabs
        document.querySelectorAll('.palette-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchPaletteTab(tabName);
            });
        });

        // Component palette drag-and-drop
        this.setupPaletteDragDrop();
    }

    switchPaletteTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.palette-tab').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.palette-tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }
    }

    setupPaletteDragDrop() {
        // Canvas drop handling
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const componentType = e.dataTransfer.getData('componentType');
            if (componentType) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.interactionManager.addComponent(componentType, x, y);
            }
        });
    }

    createNewCircuit(name) {
        const circuit = new Circuit(name);
        this.circuits.set(name, circuit);
        
        // Add to selector
        const selector = document.getElementById('circuit-select');
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
        
        // Always make it a subcircuit (except for main)
        if (name !== 'main') {
            circuit.isSubcircuit = true;
            this.componentRegistry.registerSubcircuit(name, circuit);
        }
        
        // Rebuild palette to show new subcircuit
        this.buildCircuitsList();
        
        // Switch to new circuit
        selector.value = name;
        this.switchCircuit(name);
    }

    switchCircuit(name) {
        if (!this.circuits.has(name)) return;
        
        this.currentCircuitName = name;
        const circuit = this.getCurrentCircuit();
        
        // Update interaction manager
        this.interactionManager.circuit = circuit;
        
        // Update simulator
        this.simulator.stop();
        this.simulator = new Simulator(circuit);
        this.interactionManager.simulator = this.simulator; // Update reference
        
        // Update circuit selector dropdown
        const selector = document.getElementById('circuit-select');
        if (selector) {
            selector.value = name;
        }
        
        // Update button states
        this.updateCircuitButtons();
        
        this.updateStatus(`Switched to: ${name}`);
    }

    updateCircuitButtons() {
        const isMainCircuit = this.currentCircuitName === 'main';
        const exportBtn = document.getElementById('btn-export-circuit');
        const deleteBtn = document.getElementById('btn-delete-circuit');
        
        // Disable export/delete for main circuit
        if (exportBtn) {
            exportBtn.disabled = isMainCircuit;
            exportBtn.style.opacity = isMainCircuit ? '0.5' : '1';
            exportBtn.style.cursor = isMainCircuit ? 'not-allowed' : 'pointer';
        }
        if (deleteBtn) {
            deleteBtn.disabled = isMainCircuit;
            deleteBtn.style.opacity = isMainCircuit ? '0.5' : '1';
            deleteBtn.style.cursor = isMainCircuit ? 'not-allowed' : 'pointer';
        }
    }

    async exportCurrentCircuit() {
        if (this.currentCircuitName === 'main') {
            await this.modal.showAlert('Cannot export the main circuit. Use "Save" to save the entire project.', 'Cannot Export');
            return;
        }
        this.exportSubcircuit(this.currentCircuitName);
    }

    async deleteCurrentCircuit() {
        if (this.currentCircuitName === 'main') {
            await this.modal.showAlert('Cannot delete the main circuit.', 'Cannot Delete');
            return;
        }
        this.deleteSubcircuit(this.currentCircuitName);
    }

    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    updateSimulationUI(isRunning) {
        const simulateBtn = document.getElementById('btn-simulate');
        const stopBtn = document.getElementById('btn-stop');
        
        if (isRunning) {
            simulateBtn.disabled = true;
            simulateBtn.style.opacity = '0.5';
            stopBtn.disabled = false;
            stopBtn.style.opacity = '1';
            stopBtn.style.background = '#d9534f';
        } else {
            simulateBtn.disabled = false;
            simulateBtn.style.opacity = '1';
            stopBtn.disabled = true;
            stopBtn.style.opacity = '0.5';
        }
    }

    startRenderLoop() {
        const render = () => {
            const circuit = this.getCurrentCircuit();
            const tempWire = this.interactionManager.getTemporaryWire();
            const selectionBox = this.interactionManager.getSelectionBox();
            const hoveredComponent = this.interactionManager.getHoveredComponent();
            this.renderer.render(circuit, tempWire, selectionBox, hoveredComponent);
            requestAnimationFrame(render);
        };
        render();
    }

    // Save/Load functionality using File System Access API
    async saveProject() {
        try {
            // Check if File System Access API is supported
            if (!window.showSaveFilePicker) {
                this.fallbackSave();
                return;
            }

            const data = {
                version: '1.0',
                circuits: Array.from(this.circuits.entries()).map(([name, circuit]) => ({
                    name: name,
                    isSubcircuit: circuit.isSubcircuit || false,
                    data: circuit.serialize()
                })),
                currentCircuit: this.currentCircuitName
            };

            const json = JSON.stringify(data, null, 2);

            // Show save file picker
            const handle = await window.showSaveFilePicker({
                suggestedName: 'circuit.logico',
                types: [{
                    description: 'Logico Circuit Files',
                    accept: { 'application/json': ['.logico', '.json'] }
                }]
            });

            // Write to file
            const writable = await handle.createWritable();
            await writable.write(json);
            await writable.close();

            this.updateStatus('Project saved successfully');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Save failed:', err);
                this.updateStatus('Save failed: ' + err.message);
            }
        }
    }

    async loadProject() {
        try {
            // Check if File System Access API is supported
            if (!window.showOpenFilePicker) {
                this.fallbackLoad();
                return;
            }

            // Show open file picker
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Logico Circuit Files',
                    accept: { 'application/json': ['.logico', '.json'] }
                }],
                multiple: false
            });

            // Read file
            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);

            // Clear existing circuits
            this.circuits.clear();
            
            // Load circuits
            data.circuits.forEach(circuitData => {
                const circuit = new Circuit(circuitData.name);
                circuit.isSubcircuit = circuitData.isSubcircuit || false;
                circuit.deserialize(circuitData.data, this.circuits, this.createComponent.bind(this));
                this.circuits.set(circuitData.name, circuit);
                
                // Register subcircuits in component registry
                if (circuit.isSubcircuit) {
                    this.componentRegistry.registerSubcircuit(circuitData.name, circuit);
                }
            });

            // Update circuit selector
            this.updateCircuitSelector();

            // Rebuild palette to show imported subcircuits
            this.buildCircuitsList();

            // Switch to saved current circuit or main
            const targetCircuit = data.currentCircuit || 'main';
            if (this.circuits.has(targetCircuit)) {
                this.switchCircuit(targetCircuit);
            } else if (this.circuits.has('main')) {
                this.switchCircuit('main');
            } else {
                // If no main circuit, switch to first available
                const firstCircuit = this.circuits.keys().next().value;
                if (firstCircuit) {
                    this.switchCircuit(firstCircuit);
                }
            }

            this.updateStatus('Project loaded successfully');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Load failed:', err);
                this.updateStatus('Load failed: ' + err.message);
            }
        }
    }

    // Fallback save for browsers without File System Access API
    fallbackSave() {
        const data = {
            version: '1.0',
            circuits: Array.from(this.circuits.entries()).map(([name, circuit]) => ({
                name: name,
                isSubcircuit: circuit.isSubcircuit || false,
                data: circuit.serialize()
            })),
            currentCircuit: this.currentCircuitName
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.logico';
        a.click();
        
        URL.revokeObjectURL(url);
        this.updateStatus('Project saved (fallback method)');
    }

    // Fallback load for browsers without File System Access API
    fallbackLoad() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.logico,.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Clear existing circuits
                    this.circuits.clear();
                    
                    // Load circuits
                    data.circuits.forEach(circuitData => {
                        const circuit = new Circuit(circuitData.name);
                        circuit.isSubcircuit = circuitData.isSubcircuit || false;
                        circuit.deserialize(circuitData.data, this.circuits, this.createComponent.bind(this));
                        this.circuits.set(circuitData.name, circuit);
                        
                        // Register subcircuits in component registry
                        if (circuit.isSubcircuit) {
                            this.componentRegistry.registerSubcircuit(circuitData.name, circuit);
                        }
                    });

                    // Update circuit selector
                    this.updateCircuitSelector();

                    // Rebuild palette to show imported subcircuits
                    this.buildCircuitsList();

                    // Switch to saved current circuit or main
                    const targetCircuit = data.currentCircuit || 'main';
                    if (this.circuits.has(targetCircuit)) {
                        this.switchCircuit(targetCircuit);
                    } else if (this.circuits.has('main')) {
                        this.switchCircuit('main');
                    } else {
                        const firstCircuit = this.circuits.keys().next().value;
                        if (firstCircuit) {
                            this.switchCircuit(firstCircuit);
                        }
                    }

                    this.updateStatus('Project loaded successfully');
                } catch (err) {
                    console.error('Load failed:', err);
                    this.updateStatus('Load failed: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    updateCircuitSelector() {
        const selector = document.getElementById('circuit-select');
        selector.innerHTML = '';
        
        this.circuits.forEach((circuit, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            selector.appendChild(option);
        });
        
        selector.value = this.currentCircuitName;
    }

    // Delete a subcircuit
    async deleteSubcircuit(name) {
        if (!this.circuits.has(name)) return;
        
        const circuit = this.circuits.get(name);
        if (!circuit.isSubcircuit) {
            await this.modal.showAlert('Cannot delete: This is not a subcircuit.', 'Cannot Delete');
            return;
        }
        
        // Check if any circuit uses this subcircuit
        let isUsed = false;
        this.circuits.forEach((c, circuitName) => {
            if (circuitName !== name) {
                const hasSubcircuit = c.components.some(comp => 
                    comp.type === 'SUBCIRCUIT_' + name
                );
                if (hasSubcircuit) {
                    isUsed = true;
                }
            }
        });
        
        if (isUsed) {
            await this.modal.showAlert(`Cannot delete subcircuit "${name}" because it is being used in other circuits.`, 'Cannot Delete');
            return;
        }
        
        if (!await this.modal.showConfirm(`Delete subcircuit "${name}"?`, 'Delete Subcircuit')) {
            return;
        }
        
        // Remove from circuits
        this.circuits.delete(name);
        
        // Unregister from component registry
        this.componentRegistry.unregister('SUBCIRCUIT_' + name);
        
        // Update circuit selector
        this.updateCircuitSelector();
        
        // Rebuild palette to remove deleted subcircuit
        this.buildCircuitsList();
        
        // If we're currently viewing the deleted circuit, switch to main
        if (this.currentCircuitName === name) {
            if (this.circuits.has('main')) {
                this.switchCircuit('main');
            } else {
                const firstCircuit = this.circuits.keys().next().value;
                if (firstCircuit) {
                    this.switchCircuit(firstCircuit);
                }
            }
        }
        
        this.updateStatus(`Deleted subcircuit: ${name}`);
    }

    // Export a subcircuit to a file
    async exportSubcircuit(name) {
        try {
            const circuit = this.circuits.get(name);
            if (!circuit || !circuit.isSubcircuit) {
                await this.modal.showAlert('This circuit is not a subcircuit.', 'Cannot Export');
                return;
            }
            
            const data = {
                version: '1.0',
                type: 'subcircuit',
                name: name,
                circuit: circuit.serialize()
            };
            
            const json = JSON.stringify(data, null, 2);
            
            // Check if File System Access API is supported
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${name}.subcircuit`,
                    types: [{
                        description: 'Logico Subcircuit Files',
                        accept: { 'application/json': ['.subcircuit', '.json'] }
                    }]
                });
                
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                
                this.updateStatus(`Exported subcircuit: ${name}`);
            } else {
                // Fallback
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}.subcircuit`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.updateStatus(`Exported subcircuit: ${name} (fallback method)`);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Export failed:', err);
                this.updateStatus('Export failed: ' + err.message);
            }
        }
    }

    // Import a subcircuit from a file
    async importSubcircuit() {
        try {
            // Check if File System Access API is supported
            if (window.showOpenFilePicker) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Logico Subcircuit Files',
                        accept: { 'application/json': ['.subcircuit', '.json'] }
                    }],
                    multiple: false
                });
                
                const file = await handle.getFile();
                const text = await file.text();
                const data = JSON.parse(text);
                
                this.processImportedSubcircuit(data);
            } else {
                // Fallback
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.subcircuit,.json';
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            this.processImportedSubcircuit(data);
                        } catch (err) {
                            console.error('Import failed:', err);
                            this.updateStatus('Import failed: ' + err.message);
                        }
                    };
                    reader.readAsText(file);
                };
                
                input.click();
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Import failed:', err);
                this.updateStatus('Import failed: ' + err.message);
            }
        }
    }

    async processImportedSubcircuit(data) {
        if (data.type !== 'subcircuit') {
            await this.modal.showAlert('Invalid subcircuit file.', 'Import Error');
            return;
        }
        
        let name = data.name;
        
        // Check if name already exists
        if (this.circuits.has(name)) {
            const newName = await this.modal.showPrompt(`Subcircuit "${name}" already exists. Enter a new name:`, 'Rename Subcircuit', name + '_imported');
            if (!newName) return;
            name = newName;
        }
        
        // Create the circuit
        const circuit = new Circuit(name);
        circuit.isSubcircuit = true;
        circuit.deserialize(data.circuit, this.circuits, this.createComponent.bind(this));
        
        this.circuits.set(name, circuit);
        
        // Register in component registry
        this.componentRegistry.registerSubcircuit(name, circuit);
        
        // Update UI
        this.updateCircuitSelector();
        this.buildCircuitsList();
        
        this.updateStatus(`Imported subcircuit: ${name}`);
    }

    saveToFile() {
        const data = {
            version: '1.0',
            circuits: Array.from(this.circuits.entries()).map(([name, circuit]) => ({
                name: name,
                data: circuit.serialize()
            }))
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.logico';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // TODO: Implement circuit deserialization
                this.updateStatus('Circuit loaded');
            } catch (error) {
                this.modal.showAlert('Error loading file: ' + error.message, 'Load Error');
            }
        };
        reader.readAsText(file);
    }
}
