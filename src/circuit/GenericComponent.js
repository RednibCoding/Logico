// Generic Component - created from JSON definition
class GenericComponent extends Component {
    constructor(x, y, definition) {
        // Get width and height from rendering definition
        const width = definition.rendering.width || 60;
        const height = definition.rendering.height || 40;
        
        super(definition.id, x, y, width, height);
        this.definition = definition;
        this.name = definition.name;
        this.description = definition.description;
        
        // Initialize state from definition
        this.state = {};
        if (definition.logic && definition.logic.state) {
            Object.assign(this.state, definition.logic.state);
        }
        
        this.setupPins();
        
        // Run initialization code if provided
        if (definition.logic && definition.logic.init) {
            try {
                const func = new Function('state', definition.logic.init);
                func(this.state);
            } catch (error) {
                console.error(`Error in init code for ${this.type}:`, error);
            }
        }
    }

    setupPins() {
        // Create input pins
        this.definition.pins.inputs.forEach(pinDef => {
            this.addInputPin(pinDef.x, pinDef.y, pinDef.label);
        });

        // Create output pins
        this.definition.pins.outputs.forEach(pinDef => {
            this.addOutputPin(pinDef.x, pinDef.y, pinDef.label);
        });
    }

    evaluate() {
        const logic = this.definition.logic;

        if (logic.code) {
            // Execute the logic code from JSON
            // Provide access to inputs, outputs, and state
            try {
                const func = new Function('inputs', 'outputs', 'state', logic.code);
                func(this.inputPins, this.outputPins, this.state);
            } catch (error) {
                console.error(`Error evaluating logic for ${this.type}:`, error);
            }
        }
    }

    // Update method for components that need per-frame updates (like Clock)
    update(timestamp) {
        const logic = this.definition.logic;
        
        if (logic.update) {
            try {
                const func = new Function('inputs', 'outputs', 'state', 'timestamp', logic.update);
                func(this.inputPins, this.outputPins, this.state, timestamp);
            } catch (error) {
                console.error(`Error in update code for ${this.type}:`, error);
            }
        }
    }

    // Click handler for interactive components (like InputPin)
    onClick() {
        const logic = this.definition.logic;
        
        if (logic.onClick) {
            try {
                const func = new Function('inputs', 'outputs', 'state', logic.onClick);
                func(this.inputPins, this.outputPins, this.state);
                // Re-evaluate after state change
                this.evaluate();
            } catch (error) {
                console.error(`Error in onClick code for ${this.type}:`, error);
            }
        }
    }

    // Get value (for components like OutputPin and LED)
    getValue() {
        if (this.inputPins.length > 0) {
            return this.inputPins[0].getValue();
        }
        return false;
    }

    // Methods for backward compatibility
    toggle() {
        this.onClick();
    }

    setState(value) {
        if (this.state.value !== undefined) {
            this.state.value = value;
            this.evaluate();
        }
    }

    // Get rendering definition
    getRenderingDef() {
        return this.definition.rendering;
    }
}
