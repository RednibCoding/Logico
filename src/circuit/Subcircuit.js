// Subcircuit component - represents a reusable circuit as a component
class SubcircuitComponent extends Component {
    constructor(x, y, circuitName, circuitInstance) {
        super('SUBCIRCUIT', x, y, 80, 60);
        this.circuitName = circuitName;
        this.circuitInstance = circuitInstance;
        this.setupPins();
    }

    setupPins() {
        // Dynamically create pins based on INPUT and OUTPUT components in the subcircuit
        if (this.circuitInstance) {
            // Find all INPUT components in the subcircuit
            const inputs = this.circuitInstance.components.filter(c => c.type === 'INPUT');
            const outputs = this.circuitInstance.components.filter(c => c.type === 'OUTPUT');
            
            // Create input pins on the left (centered coordinate system)
            const inputSpacing = this.height / (inputs.length + 1);
            inputs.forEach((input, i) => {
                const yOffset = inputSpacing * (i + 1) - this.height / 2;
                this.addInputPin(-this.width / 2, yOffset);
            });
            
            // Create output pins on the right (centered coordinate system)
            const outputSpacing = this.height / (outputs.length + 1);
            outputs.forEach((output, i) => {
                const yOffset = outputSpacing * (i + 1) - this.height / 2;
                this.addOutputPin(this.width / 2, yOffset);
            });
        } else {
            // Fallback if no circuit instance (centered coordinate system)
            this.addInputPin(-this.width / 2, -this.height / 6);
            this.addInputPin(-this.width / 2, this.height / 6);
            this.addOutputPin(this.width / 2, 0);
        }
    }

    evaluate() {
        if (!this.circuitInstance) {
            // Fallback: OR of inputs
            let result = false;
            for (let pin of this.inputPins) {
                result = result || pin.getValue();
            }
            if (this.outputPins.length > 0) {
                this.outputPins[0].setValue(result);
            }
            return;
        }
        
        // 1. Map input pin values to the subcircuit's INPUT components
        const inputs = this.circuitInstance.components.filter(c => c.type === 'INPUT');
        inputs.forEach((input, i) => {
            if (this.inputPins[i]) {
                // Set the state.value property instead of state directly
                if (!input.state) {
                    input.state = {};
                }
                input.state.value = this.inputPins[i].getValue();
                // Evaluate INPUT to propagate value to its output pin
                input.evaluate();
            }
        });
        
        // 2. Evaluate all other components in the subcircuit using topological sort
        // (skip INPUT components as they're already evaluated)
        const ordered = this.topologicalSort();
        ordered.forEach(component => {
            if (component.type !== 'INPUT') {
                component.evaluate();
            }
        });
        
        // 3. Map the subcircuit's OUTPUT components to output pin values
        const outputs = this.circuitInstance.components.filter(c => c.type === 'OUTPUT');
        outputs.forEach((output, i) => {
            if (this.outputPins[i]) {
                this.outputPins[i].setValue(output.getValue());
            }
        });
    }

    // Topological sort for subcircuit evaluation
    topologicalSort() {
        const visited = new Set();
        const result = [];
        
        // Build adjacency list
        const graph = new Map();
        this.circuitInstance.components.forEach(comp => {
            graph.set(comp, []);
        });

        // Add edges based on wires
        this.circuitInstance.wires.forEach(wire => {
            const from = wire.fromPin.component;
            const to = wire.toPin.component;
            if (graph.has(from) && graph.has(to)) {
                graph.get(from).push(to);
            }
        });

        // DFS visit function
        const visit = (component) => {
            if (visited.has(component)) return;
            visited.add(component);
            
            const neighbors = graph.get(component) || [];
            neighbors.forEach(neighbor => visit(neighbor));
            
            result.unshift(component);
        };

        // Visit all components
        this.circuitInstance.components.forEach(comp => {
            if (!visited.has(comp)) {
                visit(comp);
            }
        });

        return result;
    }

    serialize() {
        const base = super.serialize();
        base.circuitName = this.circuitName;
        return base;
    }
}
