// Component Registry - Centralized component definitions
class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.categories = new Map();
        this.componentDefinitions = new Map(); // Store JSON definitions
    }

    // Initialize - load components from individual JSON files
    async init() {
        const componentFiles = [
            // Basic Logic Gates
            'components/and.json',
            'components/or.json',
            'components/not.json',
            'components/xor.json',
            'components/nand.json',
            'components/nor.json',
            'components/buffer.json',
            'components/tristate-buffer.json',
            'components/schmitt-trigger.json',
            // Input/Output
            'components/input.json',
            'components/output.json',
            'components/clock.json',
            'components/led.json',
            'components/open-collector.json',
            'components/pull-up.json',
            'components/pull-down.json',
            'components/debouncer.json',
            'components/switch-spst.json',
            'components/switch-spdt.json',
            'components/push-button.json',
            'components/probe.json',
            'components/constant.json',
            'components/ground.json',
            'components/vcc.json',
            'components/splitter-8bit.json',
            'components/merger-8bit.json',
            'components/bidirectional-bus.json',
            // Sequential Logic
            'components/d-flip-flop.json',
            'components/jk-flip-flop.json',
            'components/t-flip-flop.json',
            'components/sr-latch.json',
            'components/toggle-flipflop.json',
            'components/edge-detector.json',
            'components/monostable.json',
            'components/astable.json',
            'components/delay.json',
            'components/timer.json',
            'components/watchdog.json',
            'components/pwm-generator.json',
            'components/random-generator.json',
            'components/frequency-divider.json',
            // Arithmetic (8-bit)
            'components/half-adder.json',
            'components/full-adder.json',
            'components/8-bit-adder.json',
            'components/8-bit-alu.json',
            'components/8-bit-comparator.json',
            // Arithmetic (16-bit)
            'components/16-bit-adder.json',
            'components/16-bit-alu.json',
            'components/16-bit-comparator.json',
            // Arithmetic (Specialized)
            'components/zero-detector.json',
            'components/barrel-shifter.json',
            'components/parity-generator.json',
            'components/parity-checker.json',
            'components/magnitude-comparator.json',
            'components/bcd-adder.json',
            // Multiplexers & Demultiplexers
            'components/mux-2to1.json',
            'components/mux-4to1.json',
            'components/mux-8to1.json',
            'components/demux-4to16.json',
            // Decoders & Encoders
            'components/decoder-2to4.json',
            'components/decoder-3to8.json',
            'components/instruction-decoder.json',
            'components/priority-encoder.json',
            'components/bcd-to-7seg.json',
            'components/gray-to-binary.json',
            'components/binary-to-gray.json',
            'components/excess3-converter.json',
            // Memory (8-bit)
            'components/8-bit-register.json',
            'components/ram-16byte.json',
            'components/rom-16byte.json',
            'components/ram-256byte.json',
            'components/rom-256byte.json',
            'components/dual-port-ram.json',
            'components/fifo.json',
            // Memory (16-bit)
            'components/16-bit-register.json',
            // Counters & Shift Registers (8-bit)
            'components/4-bit-counter.json',
            'components/8-bit-counter.json',
            'components/8-bit-shift-register.json',
            // Counters & Shift Registers (16-bit)
            'components/16-bit-counter.json',
            'components/16-bit-shift-register.json',
            // CPU Components
            'components/program-counter.json',
            'components/stack-pointer.json',
            // Bus & I/O
            'components/bus-transceiver.json',
            // Display (8-bit)
            'components/hex-display.json',
            'components/7-segment-display.json',
            'components/8-bit-binary-display.json',
            // Display (16-bit)
            'components/16-bit-hex-display.json',
            // Display (Specialized)
            'components/segment-driver.json',
            'components/dot-matrix.json',
            // Communication Protocols
            'components/uart-tx.json',
            'components/uart-rx.json',
            'components/spi-master.json',
            'components/i2c-master.json',
            // Advanced I/O & Control
            'components/keypad-4x4.json',
            'components/dac-8bit.json',
            'components/adc-8bit.json',
            'components/servo-controller.json',
            'components/stepper-controller.json'
        ];

        for (const file of componentFiles) {
            await this.loadComponentFromJSON(file);
        }
    }

    // Load a single component definition from JSON file
    async loadComponentFromJSON(url) {
        try {
            const response = await fetch(url);
            const def = await response.json();
            
            this.componentDefinitions.set(def.id, def);
            
            // All components use GenericComponent
            this.register({
                id: def.id,
                name: def.name,
                category: def.category,
                class: GenericComponent,
                description: def.description,
                definition: def
            });
        } catch (error) {
            console.error(`Failed to load component from ${url}:`, error);
        }
    }

    // Register a component type
    register(config) {
        const {
            id,              // Unique identifier (e.g., 'AND')
            name,            // Display name (e.g., 'AND Gate')
            category,        // Category for palette grouping
            class: ComponentClass,  // The component class
            icon,            // Optional icon character
            description,     // Optional description
            definition       // JSON definition
        } = config;

        this.components.set(id, {
            id,
            name,
            category,
            class: ComponentClass,
            icon: icon || null,
            description: description || '',
            definition: definition || null
        });

        // Add to category
        if (!this.categories.has(category)) {
            this.categories.set(category, []);
        }
        this.categories.get(category).push(id);
    }

    // Get component definition
    get(id) {
        return this.components.get(id);
    }

    // Get JSON definition
    getDefinition(id) {
        return this.componentDefinitions.get(id);
    }

    // Create a component instance
    create(id, x, y, ...args) {
        const def = this.components.get(id);
        if (!def) {
            console.error(`Component type "${id}" not found`);
            return null;
        }

        // Get JSON definition
        const jsonDef = this.componentDefinitions.get(id);
        
        // All components now use GenericComponent with JSON definition
        if (jsonDef) {
            return new GenericComponent(x, y, jsonDef);
        }

        // Fallback to class-based creation (for subcircuits)
        if (def.class) {
            return new def.class(x, y, ...args);
        }

        return null;
    }

    // Get all components in a category
    getCategory(category) {
        const ids = this.categories.get(category) || [];
        return ids.map(id => this.components.get(id));
    }

    // Get all categories
    getAllCategories() {
        return Array.from(this.categories.keys());
    }

    // Get all components
    getAll() {
        return Array.from(this.components.values());
    }

    // Register a subcircuit dynamically
    registerSubcircuit(name, circuitInstance) {
        const id = 'SUBCIRCUIT_' + name;
        
        // Remove if already registered
        if (this.components.has(id)) {
            this.unregister(id);
        }

        this.register({
            id: id,
            name: name,
            category: 'Subcircuits',
            class: SubcircuitComponent,
            description: `Subcircuit: ${name}`
        });

        // Store circuit instance for later use
        const def = this.components.get(id);
        def.circuitInstance = circuitInstance;
    }

    // Unregister a component (useful for removing subcircuits)
    unregister(id) {
        const def = this.components.get(id);
        if (!def) return;

        // Remove from category
        const categoryIds = this.categories.get(def.category);
        if (categoryIds) {
            const index = categoryIds.indexOf(id);
            if (index > -1) {
                categoryIds.splice(index, 1);
            }
            // Remove category if empty
            if (categoryIds.length === 0) {
                this.categories.delete(def.category);
            }
        }

        this.components.delete(id);
    }
}
