// Simulation engine - evaluates circuit logic
class Simulator {
    constructor(circuit) {
        this.circuit = circuit;
        this.running = false;
        this.animationId = null;
        this.lastTimestamp = 0;
    }

    // Start simulation
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        this.loop(this.lastTimestamp);
    }

    // Stop simulation
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Main simulation loop
    loop(timestamp) {
        if (!this.running) return;

        // Update clocks
        this.circuit.components.forEach(component => {
            if (component.type === 'CLOCK') {
                component.update(timestamp);
            }
        });

        // Evaluate circuit
        this.evaluate();

        // Continue loop
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }

    // Evaluate all components in proper order
    evaluate() {
        // Topological sort to determine evaluation order
        const ordered = this.topologicalSort();
        
        // Evaluate each component
        ordered.forEach(component => {
            component.evaluate();
        });
    }

    // Topological sort to get evaluation order
    topologicalSort() {
        const visited = new Set();
        const result = [];
        
        // Build adjacency list
        const graph = new Map();
        this.circuit.components.forEach(comp => {
            graph.set(comp, []);
        });

        // Add edges based on wires
        this.circuit.wires.forEach(wire => {
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
        this.circuit.components.forEach(comp => {
            if (!visited.has(comp)) {
                visit(comp);
            }
        });

        return result;
    }

    // Single-step evaluation (for debugging)
    step() {
        this.evaluate();
    }

    // Reset all component states
    reset() {
        this.circuit.components.forEach(component => {
            component.getAllPins().forEach(pin => {
                pin.value = false;
            });
            if (component.type === 'INPUT' || component.type === 'CLOCK') {
                component.state = false;
            }
        });
        this.evaluate();
    }
}
