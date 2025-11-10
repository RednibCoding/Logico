// Interaction Manager - handles user input
class InteractionManager {
    constructor(canvas, renderer, circuit, simulator = null, app = null) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.circuit = circuit;
        this.simulator = simulator;
        this.app = app; // Reference to main app to access all circuits

        // Interaction state
        this.isDragging = false;
        this.isDrawingWire = false;
        this.isPanning = false;
        this.isSelecting = false; // For selection box
        this.draggedComponent = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.wireStartPin = null;
        this.tempWireTo = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.selectionStart = null; // Selection box start position
        this.selectionEnd = null;   // Selection box end position
        
        // Interactive component tracking
        this.clickedComponent = null;
        this.clickStartPos = null;
        
        // Tooltip
        this.hoveredComponent = null;
        
        // Clipboard for copy/paste
        this.clipboard = {
            components: [],
            wires: []
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);
        const worldPos = this.renderer.screenToWorld(pos.x, pos.y);

        // Right-click for panning
        if (e.button === 2) {
            this.isPanning = true;
            this.lastMouseX = pos.x;
            this.lastMouseY = pos.y;
            this.canvas.classList.add('dragging');
            return;
        }

        // Check if clicking on a pin (for wire drawing)
        const pin = this.circuit.getPinAtPoint(worldPos.x, worldPos.y);
        if (pin) {
            if (pin.type === 'output') {
                this.isDrawingWire = true;
                this.wireStartPin = pin;
                this.tempWireTo = worldPos;
                this.canvas.classList.add('drawing-wire');
            }
            return;
        }

        // Check if clicking on a component
        const component = this.circuit.getComponentAtPoint(worldPos.x, worldPos.y);
        if (component) {
            // In simulation mode, check if component is interactive
            if (this.simulator && this.simulator.running) {
                // Check if component has interactive handlers
                if (component.onMouseDown || component.onMouseUp) {
                    // Store for interactive behavior, don't start dragging
                    this.clickedComponent = component;
                    this.clickStartPos = { x: worldPos.x, y: worldPos.y };
                    
                    // Call onMouseDown immediately for press-and-hold behavior
                    if (component.onMouseDown) {
                        const localX = worldPos.x - component.x;
                        const localY = worldPos.y - component.y;
                        component.onMouseDown(localX, localY);
                    }
                    return;
                }
            }
            
            // Edit mode or non-interactive component: allow selection and dragging
            // If clicking on an unselected component while not holding Ctrl, clear selection
            if (!component.selected && !e.ctrlKey && !e.metaKey) {
                this.circuit.clearSelection();
            }
            
            component.selected = true;
            this.isDragging = true;
            this.draggedComponent = component;
            this.dragOffsetX = worldPos.x - component.x;
            this.dragOffsetY = worldPos.y - component.y;
            
            // Store initial positions for all selected components
            this.draggedComponents = this.circuit.components.filter(c => c.selected);
            this.dragOffsets = this.draggedComponents.map(c => ({
                component: c,
                offsetX: worldPos.x - c.x,
                offsetY: worldPos.y - c.y
            }));
            
            return;
        }

        // Check if clicking on a wire
        const wire = this.circuit.getWireAtPoint(worldPos.x, worldPos.y);
        if (wire) {
            if (!e.ctrlKey && !e.metaKey) {
                this.circuit.clearSelection();
            }
            wire.selected = true;
            return;
        }

        // Empty space - start selection box
        if (!e.ctrlKey && !e.metaKey) {
            this.circuit.clearSelection();
        }
        this.isSelecting = true;
        this.selectionStart = worldPos;
        this.selectionEnd = worldPos;
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);
        const worldPos = this.renderer.screenToWorld(pos.x, pos.y);

        // Update mouse position display
        const mousePosEl = document.getElementById('mouse-pos');
        if (mousePosEl) {
            mousePosEl.textContent = `X: ${Math.round(worldPos.x)}, Y: ${Math.round(worldPos.y)}`;
        }

        // Update hovered component for tooltip (only when not dragging/drawing)
        if (!this.isPanning && !this.isDrawingWire && !this.isDragging && !this.isSelecting) {
            this.hoveredComponent = this.circuit.getComponentAtPoint(worldPos.x, worldPos.y);
        } else {
            this.hoveredComponent = null;
        }

        // Panning
        if (this.isPanning) {
            const dx = pos.x - this.lastMouseX;
            const dy = pos.y - this.lastMouseY;
            this.renderer.offsetX += dx;
            this.renderer.offsetY += dy;
            this.lastMouseX = pos.x;
            this.lastMouseY = pos.y;
            return;
        }

        // Drawing wire
        if (this.isDrawingWire) {
            this.tempWireTo = worldPos;
            return;
        }

        // Drawing selection box
        if (this.isSelecting) {
            this.selectionEnd = worldPos;
            this.updateSelectionBox();
            return;
        }

        // Dragging component
        if (this.isDragging && this.draggedComponents) {
            const newX = worldPos.x - this.dragOffsetX;
            const newY = worldPos.y - this.dragOffsetY;
            
            // Calculate delta from the dragged component's position
            const deltaX = newX - this.draggedComponent.x;
            const deltaY = newY - this.draggedComponent.y;
            
            // Move all selected components by the same delta
            const gridSize = this.renderer.gridSize;
            this.draggedComponents.forEach(component => {
                const targetX = component.x + deltaX;
                const targetY = component.y + deltaY;
                
                // Apply grid snapping
                component.x = Math.round(targetX / gridSize) * gridSize;
                component.y = Math.round(targetY / gridSize) * gridSize;
            });
        }
    }

    onMouseUp(e) {
        const pos = this.getMousePos(e);
        const worldPos = this.renderer.screenToWorld(pos.x, pos.y);

        // End panning
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.classList.remove('dragging');
            return;
        }

        // End selection box
        if (this.isSelecting) {
            this.isSelecting = false;
            this.selectionStart = null;
            this.selectionEnd = null;
            return;
        }

        // Complete wire drawing
        if (this.isDrawingWire) {
            const endPin = this.circuit.getPinAtPoint(worldPos.x, worldPos.y);
            
            if (endPin && endPin.type === 'input' && endPin !== this.wireStartPin) {
                // Check if wire already exists
                const existingWire = this.circuit.wires.find(w => 
                    w.fromPin === this.wireStartPin && w.toPin === endPin
                );
                
                if (!existingWire) {
                    const wire = new Wire(this.wireStartPin, endPin);
                    this.circuit.addWire(wire);
                    
                    // Immediately propagate the value through the new wire
                    endPin.setValue(this.wireStartPin.getValue());
                    
                    // Re-evaluate if simulator exists
                    if (this.simulator) {
                        this.simulator.evaluate();
                    }
                }
            }
            
            this.isDrawingWire = false;
            this.wireStartPin = null;
            this.tempWireTo = null;
            this.canvas.classList.remove('drawing-wire');
            return;
        }

        // Handle interactive components mouse up (simulation mode only)
        if (this.clickedComponent && this.simulator && this.simulator.running) {
            const component = this.clickedComponent;
            const localX = worldPos.x - component.x;
            const localY = worldPos.y - component.y;
            
            // Call onMouseUp to release
            if (component.onMouseUp) {
                component.onMouseUp(localX, localY);
            }
        }
        
        // Always clear click tracking
        this.clickedComponent = null;
        this.clickStartPos = null;

        // End dragging - snap to grid
        if (this.isDragging && this.draggedComponent) {
            const gridSize = this.renderer.gridSize;
            this.draggedComponent.x = Math.round(this.draggedComponent.x / gridSize) * gridSize;
            this.draggedComponent.y = Math.round(this.draggedComponent.y / gridSize) * gridSize;
        }
        
        this.isDragging = false;
        this.draggedComponent = null;
    }

    onDoubleClick(e) {
        const pos = this.getMousePos(e);
        const worldPos = this.renderer.screenToWorld(pos.x, pos.y);

        const component = this.circuit.getComponentAtPoint(worldPos.x, worldPos.y);
        if (component) {
            // Check for INPUT component toggle (only during simulation)
            if (component.type === 'INPUT' && this.simulator && this.simulator.running) {
                component.toggle();
                return;
            }
            
            // Open properties panel if app has one (only in edit mode)
            if (this.app && this.app.propertiesPanel && (!this.simulator || !this.simulator.running)) {
                this.app.propertiesPanel.show(component);
            }
        }
    }

    onWheel(e) {
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        this.renderer.zoomTo(pos.x, pos.y, -e.deltaY);
    }

    onKeyDown(e) {
        // Ignore keyboard shortcuts if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        )) {
            return; // Let the input handle the event
        }

        // Copy (Ctrl+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
            this.copySelected();
            e.preventDefault();
            return;
        }

        // Cut (Ctrl+X)
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
            this.cutSelected();
            e.preventDefault();
            return;
        }

        // Paste (Ctrl+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            this.paste();
            e.preventDefault();
            return;
        }

        // Delete selected items
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selected = this.circuit.getSelected();
            
            selected.wires.forEach(wire => {
                this.circuit.removeWire(wire);
            });
            
            selected.components.forEach(component => {
                this.circuit.removeComponent(component);
            });
            
            // Re-evaluate if simulator exists to update component states
            if (this.simulator) {
                this.simulator.evaluate();
            }
            
            e.preventDefault();
        }

        // Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            this.circuit.components.forEach(c => c.selected = true);
            this.circuit.wires.forEach(w => w.selected = true);
            e.preventDefault();
        }

        // Escape - clear selection
        if (e.key === 'Escape') {
            this.circuit.clearSelection();
            if (this.isDrawingWire) {
                this.isDrawingWire = false;
                this.wireStartPin = null;
                this.tempWireTo = null;
                this.canvas.classList.remove('drawing-wire');
            }
        }
    }

    copySelected() {
        const selected = this.circuit.getSelected();
        
        if (selected.components.length === 0) {
            return; // Nothing to copy
        }

        // Deep copy selected components
        this.clipboard.components = selected.components.map(comp => this.cloneComponent(comp));
        
        // Copy wires that connect selected components
        this.clipboard.wires = [];
        selected.wires.forEach(wire => {
            // Only copy if both endpoints are in selected components
            if (selected.components.includes(wire.fromPin.component) &&
                selected.components.includes(wire.toPin.component)) {
                this.clipboard.wires.push({
                    fromCompIndex: selected.components.indexOf(wire.fromPin.component),
                    fromPinIndex: wire.fromPin.index,
                    fromPinType: 'output',
                    toCompIndex: selected.components.indexOf(wire.toPin.component),
                    toPinIndex: wire.toPin.index,
                    toPinType: 'input'
                });
            }
        });
    }

    cutSelected() {
        this.copySelected();
        
        const selected = this.circuit.getSelected();
        
        selected.wires.forEach(wire => {
            this.circuit.removeWire(wire);
        });
        
        selected.components.forEach(component => {
            this.circuit.removeComponent(component);
        });
        
        if (this.simulator) {
            this.simulator.evaluate();
        }
    }

    paste() {
        if (this.clipboard.components.length === 0) {
            return; // Nothing to paste
        }

        this.circuit.clearSelection();

        // Create new components offset from originals
        const offset = 40; // Pixels to offset pasted components
        const newComponents = [];
        
        this.clipboard.components.forEach(comp => {
            const newComp = this.cloneComponent(comp);
            newComp.x += offset;
            newComp.y += offset;
            newComp.selected = true;
            this.circuit.addComponent(newComp);
            newComponents.push(newComp);
        });

        // Recreate wires between pasted components
        this.clipboard.wires.forEach(wireData => {
            const fromComp = newComponents[wireData.fromCompIndex];
            const toComp = newComponents[wireData.toCompIndex];
            
            if (fromComp && toComp) {
                const fromPin = fromComp.outputPins[wireData.fromPinIndex];
                const toPin = toComp.inputPins[wireData.toPinIndex];
                
                if (fromPin && toPin) {
                    const wire = new Wire(fromPin, toPin);
                    this.circuit.addWire(wire);
                    
                    // Propagate value through new wire
                    toPin.setValue(fromPin.getValue());
                }
            }
        });

        if (this.simulator) {
            this.simulator.evaluate();
        }
    }

    cloneComponent(component) {
        let clone = null;
        
        // Use component registry for all JSON-defined components
        if (component instanceof GenericComponent) {
            const definition = component.definition;
            clone = new GenericComponent(component.x, component.y, definition);
            
            // Copy state if it exists
            if (component.state && typeof component.state === 'object') {
                clone.state = JSON.parse(JSON.stringify(component.state));
            }
        } else if (component.type === 'SUBCIRCUIT') {
            // Handle subcircuits separately
            clone = new SubcircuitComponent(component.x, component.y, component.circuitName, component.circuitInstance);
        }
        
        if (clone) {
            clone.label = component.label;
        }
        
        return clone;
    }

    updateSelectionBox() {
        if (!this.selectionStart || !this.selectionEnd) return;

        // Calculate selection rectangle
        const x1 = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y1 = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const x2 = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const y2 = Math.max(this.selectionStart.y, this.selectionEnd.y);

        // Select components that intersect with selection box
        this.circuit.components.forEach(comp => {
            const compX1 = comp.x;
            const compY1 = comp.y;
            const compX2 = comp.x + comp.width;
            const compY2 = comp.y + comp.height;

            // Check if component intersects with selection box
            const intersects = !(compX2 < x1 || compX1 > x2 || compY2 < y1 || compY1 > y2);
            comp.selected = intersects;
        });

        // Select wires that are fully within selection box
        this.circuit.wires.forEach(wire => {
            if (wire.fromPin && wire.toPin) {
                const fromPos = wire.fromPin.getPosition();
                const toPos = wire.toPin.getPosition();
                
                const wireInBox = 
                    fromPos.x >= x1 && fromPos.x <= x2 &&
                    fromPos.y >= y1 && fromPos.y <= y2 &&
                    toPos.x >= x1 && toPos.x <= x2 &&
                    toPos.y >= y1 && toPos.y <= y2;
                    
                wire.selected = wireInBox;
            }
        });
    }

    getSelectionBox() {
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            return {
                start: this.selectionStart,
                end: this.selectionEnd
            };
        }
        return null;
    }

    getTemporaryWire() {
        if (this.isDrawingWire && this.wireStartPin && this.tempWireTo) {
            const from = this.wireStartPin.getPosition();
            return {
                from: from,
                to: this.tempWireTo
            };
        }
        return null;
    }

    getHoveredComponent() {
        return this.hoveredComponent;
    }

    // Add component from palette
    addComponent(type, x, y) {
        const worldPos = this.renderer.screenToWorld(x, y);
        
        // Snap to grid
        const gridSize = this.renderer.gridSize;
        const snappedX = Math.round(worldPos.x / gridSize) * gridSize;
        const snappedY = Math.round(worldPos.y / gridSize) * gridSize;
        
        let component = null;

        // Check if it's a subcircuit
        if (type.startsWith('SUBCIRCUIT_')) {
            const circuitName = type.substring('SUBCIRCUIT_'.length);
            // Get the actual circuit instance from the app
            const circuitInstance = this.app ? this.app.circuits.get(circuitName) : null;
            component = new SubcircuitComponent(snappedX, snappedY, circuitName, circuitInstance);
        } else {
            // Use registry to create component
            if (this.app && this.app.componentRegistry) {
                component = this.app.componentRegistry.create(type, snappedX, snappedY);
            }
        }

        if (component) {
            this.circuit.addComponent(component);
        }
    }
}
