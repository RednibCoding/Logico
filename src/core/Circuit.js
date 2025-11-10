// Circuit class - manages components and wires
class Circuit {
    constructor(name) {
        this.name = name;
        this.components = [];
        this.wires = [];
        this.isSubcircuit = false;
        
        // For subcircuits: interface pins
        this.interfaceInputs = [];
        this.interfaceOutputs = [];
    }

    // Add a component to the circuit
    addComponent(component) {
        this.components.push(component);
    }

    // Remove a component and its connected wires
    removeComponent(component) {
        // Remove all wires connected to this component
        const connectedWires = this.wires.filter(wire => 
            wire.fromPin.component === component || wire.toPin.component === component
        );
        
        connectedWires.forEach(wire => this.removeWire(wire));
        
        // Remove the component
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
        }
    }

    // Add a wire
    addWire(wire) {
        this.wires.push(wire);
    }

    // Remove a wire
    removeWire(wire) {
        wire.disconnect();
        const index = this.wires.indexOf(wire);
        if (index > -1) {
            this.wires.splice(index, 1);
        }
    }

    // Get component by ID
    getComponentById(id) {
        return this.components.find(c => c.id === id);
    }

    // Get wire by ID
    getWireById(id) {
        return this.wires.find(w => w.id === id);
    }

    // Find component at point
    getComponentAtPoint(x, y) {
        // Check in reverse order (top component first)
        for (let i = this.components.length - 1; i >= 0; i--) {
            if (this.components[i].containsPoint(x, y)) {
                return this.components[i];
            }
        }
        return null;
    }

    // Find wire at point
    getWireAtPoint(x, y) {
        for (let i = this.wires.length - 1; i >= 0; i--) {
            if (this.wires[i].containsPoint(x, y)) {
                return this.wires[i];
            }
        }
        return null;
    }

    // Find pin at point
    getPinAtPoint(x, y) {
        for (let component of this.components) {
            const pin = component.getPinAtPoint(x, y);
            if (pin) return pin;
        }
        return null;
    }

    // Clear selection
    clearSelection() {
        this.components.forEach(c => c.selected = false);
        this.wires.forEach(w => w.selected = false);
    }

    // Get selected items
    getSelected() {
        return {
            components: this.components.filter(c => c.selected),
            wires: this.wires.filter(w => w.selected)
        };
    }

    // Clear the entire circuit
    clear() {
        this.wires.forEach(wire => wire.disconnect());
        this.components = [];
        this.wires = [];
    }

    // Serialize circuit for saving
    serialize() {
        return {
            name: this.name,
            isSubcircuit: this.isSubcircuit,
            components: this.components.map(c => c.serialize()),
            wires: this.wires.map(w => w.serialize())
        };
    }

    // Deserialize circuit from saved data (instance method)
    deserialize(data, circuits, componentFactory = null) {
        // Clear current circuit
        this.clear();
        
        // Recreate components
        const componentMap = new Map();
        data.components.forEach(compData => {
            let component = null;
            
            // Try to use component factory first
            if (componentFactory) {
                component = componentFactory(compData.type, compData.x, compData.y, compData.circuitName);
            }
            
            // Fallback for subcircuits if factory didn't handle it
            if (!component && compData.type.startsWith('SUBCIRCUIT_')) {
                const circuitName = compData.circuitName || compData.type.substring('SUBCIRCUIT_'.length);
                const circuitInstance = circuits.get(circuitName);
                component = new SubcircuitComponent(compData.x, compData.y, circuitName, circuitInstance);
            }
            
            if (component) {
                component.id = compData.id;
                component.label = compData.label || '';
                
                // Restore state for stateful components
                if (compData.state !== undefined) {
                    if (typeof component.state === 'object' && component.state !== null) {
                        // State is an object, merge properties
                        Object.assign(component.state, compData.state);
                    } else {
                        // State is a primitive value
                        component.state = compData.state;
                    }
                }
                
                this.addComponent(component);
                componentMap.set(component.id, component);
            }
        });

        // Recreate wires
        data.wires.forEach(wireData => {
            const fromComp = componentMap.get(wireData.from.componentId);
            const toComp = componentMap.get(wireData.to.componentId);
            
            if (fromComp && toComp) {
                const fromPin = fromComp.outputPins[wireData.from.pinIndex];
                const toPin = toComp.inputPins[wireData.to.pinIndex];
                
                if (fromPin && toPin) {
                    const wire = new Wire(fromPin, toPin);
                    wire.id = wireData.id;
                    this.addWire(wire);
                }
            }
        });
    }

    // Deserialize circuit from saved data (static method)
    static deserialize(data, componentFactory) {
        const circuit = new Circuit(data.name);
        circuit.isSubcircuit = data.isSubcircuit || false;

        // Recreate components
        const componentMap = new Map();
        data.components.forEach(compData => {
            const component = componentFactory.create(compData.type, compData.x, compData.y);
            component.id = compData.id;
            component.label = compData.label;
            circuit.addComponent(component);
            componentMap.set(component.id, component);
        });

        // Recreate wires
        data.wires.forEach(wireData => {
            const fromComp = componentMap.get(wireData.from.componentId);
            const toComp = componentMap.get(wireData.to.componentId);
            
            if (fromComp && toComp) {
                const fromPin = fromComp.outputPins[wireData.from.pinIndex];
                const toPin = toComp.inputPins[wireData.to.pinIndex];
                
                if (fromPin && toPin) {
                    const wire = new Wire(fromPin, toPin);
                    wire.id = wireData.id;
                    circuit.addWire(wire);
                }
            }
        });

        return circuit;
    }
}
