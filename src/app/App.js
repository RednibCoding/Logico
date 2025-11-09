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

        this.setupUI();
        this.updateSimulationUI(false); // Initialize UI state
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

    // Component factory for deserialization
    createComponent(type, x, y, circuitName = null) {
        let component = null;

        // Check if it's a subcircuit
        if (type.startsWith('SUBCIRCUIT_')) {
            const subcircuitName = circuitName || type.substring('SUBCIRCUIT_'.length);
            const circuitInstance = this.circuits.get(subcircuitName);
            component = new SubcircuitComponent(x, y, subcircuitName, circuitInstance);
        } else {
            switch (type) {
                case 'AND':
                    component = new ANDGate(x, y);
                    break;
                case 'OR':
                    component = new ORGate(x, y);
                    break;
                case 'NOT':
                    component = new NOTGate(x, y);
                    break;
                case 'XOR':
                    component = new XORGate(x, y);
                    break;
                case 'NAND':
                    component = new NANDGate(x, y);
                    break;
                case 'NOR':
                    component = new NORGate(x, y);
                    break;
                case 'INPUT':
                    component = new InputPin(x, y);
                    break;
                case 'OUTPUT':
                    component = new OutputPin(x, y);
                    break;
                case 'CLOCK':
                    component = new Clock(x, y);
                    break;
                case 'LED':
                    component = new LED(x, y);
                    break;
            }
        }

        return component;
    }

    setupUI() {
        // Simulate button
        document.getElementById('btn-simulate').addEventListener('click', () => {
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

        // Clear button
        document.getElementById('btn-clear').addEventListener('click', () => {
            if (confirm('Clear the entire circuit?')) {
                this.getCurrentCircuit().clear();
                this.simulator.reset();
                this.updateStatus('Cleared');
                this.updateSimulationUI(false);
            }
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
        document.getElementById('btn-new-circuit').addEventListener('click', () => {
            const name = prompt('Enter circuit name:');
            if (name && !this.circuits.has(name)) {
                this.createNewCircuit(name);
            }
        });

        // Circuit selector
        document.getElementById('circuit-select').addEventListener('change', (e) => {
            this.switchCircuit(e.target.value);
        });

        // Component palette drag-and-drop
        this.setupPaletteDragDrop();
    }

    setupPaletteDragDrop() {
        const componentItems = document.querySelectorAll('.component-item');
        
        componentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('componentType', item.dataset.type);
            });
            
            item.setAttribute('draggable', 'true');
        });

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
            this.addSubcircuitToPanel(name);
        }
        
        // Switch to new circuit
        selector.value = name;
        this.switchCircuit(name);
    }

    addSubcircuitToPanel(name) {
        const subcircuitsList = document.getElementById('subcircuits-list');
        const item = document.createElement('div');
        item.className = 'component-item';
        item.setAttribute('data-type', 'SUBCIRCUIT_' + name);
        item.setAttribute('draggable', 'true');
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.cssText = 'flex: 1;';
        item.appendChild(nameSpan);
        
        // Add buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'subcircuit-buttons';
        
        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '↓';
        exportBtn.title = 'Export subcircuit';
        exportBtn.className = 'subcircuit-btn';
        exportBtn.onclick = (e) => {
            e.stopPropagation();
            this.exportSubcircuit(name);
        };
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete subcircuit';
        deleteBtn.className = 'subcircuit-btn subcircuit-btn-delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteSubcircuit(name);
        };
        
        buttonsDiv.appendChild(exportBtn);
        buttonsDiv.appendChild(deleteBtn);
        item.appendChild(buttonsDiv);
        
        // Add drag event
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('componentType', 'SUBCIRCUIT_' + name);
        });
        
        subcircuitsList.appendChild(item);
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
        
        this.updateStatus(`Switched to: ${name}`);
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
            this.renderer.render(circuit, tempWire, selectionBox);
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
                circuit.deserialize(circuitData.data, this.circuits);
                this.circuits.set(circuitData.name, circuit);
            });

            // Update circuit selector
            this.updateCircuitSelector();

            // Update subcircuit palette
            this.updateSubcircuitPalette();

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
                        circuit.deserialize(circuitData.data, this.circuits);
                        this.circuits.set(circuitData.name, circuit);
                    });

                    // Update circuit selector
                    this.updateCircuitSelector();

                    // Update subcircuit palette
                    this.updateSubcircuitPalette();

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

    updateSubcircuitPalette() {
        const subcircuitsList = document.getElementById('subcircuits-list');
        subcircuitsList.innerHTML = '';
        
        this.circuits.forEach((circuit, name) => {
            if (circuit.isSubcircuit) {
                this.addSubcircuitToPanel(name);
            }
        });
    }

    // Delete a subcircuit
    deleteSubcircuit(name) {
        if (!this.circuits.has(name)) return;
        
        const circuit = this.circuits.get(name);
        if (!circuit.isSubcircuit) {
            alert('Cannot delete: This is not a subcircuit.');
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
            alert(`Cannot delete subcircuit "${name}" because it is being used in other circuits.`);
            return;
        }
        
        if (!confirm(`Delete subcircuit "${name}"?`)) {
            return;
        }
        
        // Remove from circuits
        this.circuits.delete(name);
        
        // Update circuit selector
        this.updateCircuitSelector();
        
        // Update subcircuit palette
        this.updateSubcircuitPalette();
        
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
                alert('This circuit is not a subcircuit.');
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

    processImportedSubcircuit(data) {
        if (data.type !== 'subcircuit') {
            alert('Invalid subcircuit file.');
            return;
        }
        
        let name = data.name;
        
        // Check if name already exists
        if (this.circuits.has(name)) {
            const newName = prompt(`Subcircuit "${name}" already exists. Enter a new name:`, name + '_imported');
            if (!newName) return;
            name = newName;
        }
        
        // Create the circuit
        const circuit = new Circuit(name);
        circuit.isSubcircuit = true;
        circuit.deserialize(data.circuit, this.circuits);
        
        this.circuits.set(name, circuit);
        
        // Update UI
        this.updateCircuitSelector();
        this.addSubcircuitToPanel(name);
        
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
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}
