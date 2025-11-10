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

    // Reset component to initial state
    reset() {
        const logic = this.definition.logic;
        
        // Reset state to initial values from definition
        this.state = {};
        if (logic && logic.state) {
            Object.assign(this.state, logic.state);
        }
        
        // Run reset code if provided
        if (logic && logic.reset) {
            try {
                const func = new Function('inputs', 'outputs', 'state', logic.reset);
                func(this.inputPins, this.outputPins, this.state);
            } catch (error) {
                console.error(`Error in reset code for ${this.type}:`, error);
            }
        }
        
        // Re-run init code if provided
        if (logic && logic.init) {
            try {
                const func = new Function('state', logic.init);
                func(this.state);
            } catch (error) {
                console.error(`Error in init code during reset for ${this.type}:`, error);
            }
        }
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

    // Property system
    getProperty(key) {
        const properties = this.definition.properties || {};
        const propDef = properties[key];
        
        if (!propDef) return undefined;
        
        // Check if value is in state
        if (this.state[key] !== undefined) {
            return this.state[key];
        }
        
        // Return default value
        return propDef.default;
    }

    setProperty(key, value) {
        const properties = this.definition.properties || {};
        const propDef = properties[key];
        
        if (!propDef) {
            console.warn(`Property ${key} not defined for ${this.type}`);
            return;
        }

        // Validate and convert value
        let validatedValue = value;
        
        if (propDef.type === 'number') {
            validatedValue = parseFloat(value);
            if (isNaN(validatedValue)) {
                validatedValue = propDef.default || 0;
            }
            if (propDef.min !== undefined) {
                validatedValue = Math.max(propDef.min, validatedValue);
            }
            if (propDef.max !== undefined) {
                validatedValue = Math.min(propDef.max, validatedValue);
            }
        } else if (propDef.type === 'boolean') {
            validatedValue = Boolean(value);
        }

        // Update state
        this.state[key] = validatedValue;

        // Run onChange callback if provided
        if (propDef.onChange) {
            try {
                const func = new Function('state', 'value', propDef.onChange);
                func(this.state, validatedValue);
            } catch (error) {
                console.error(`Error in onChange for property ${key}:`, error);
            }
        }

        // Re-evaluate component
        this.evaluate();
    }

    // Mouse interaction handlers
    onMouseDown(x, y) {
        const logic = this.definition.logic;
        
        if (logic.onMouseDown) {
            try {
                const func = new Function('inputs', 'outputs', 'state', 'x', 'y', logic.onMouseDown);
                func(this.inputPins, this.outputPins, this.state, x, y);
                this.evaluate();
                return true; // Handled
            } catch (error) {
                console.error(`Error in onMouseDown code for ${this.type}:`, error);
            }
        }
        return false;
    }

    onMouseUp(x, y) {
        const logic = this.definition.logic;
        
        if (logic.onMouseUp) {
            try {
                const func = new Function('inputs', 'outputs', 'state', 'x', 'y', logic.onMouseUp);
                func(this.inputPins, this.outputPins, this.state, x, y);
                this.evaluate();
                return true; // Handled
            } catch (error) {
                console.error(`Error in onMouseUp code for ${this.type}:`, error);
            }
        }
        return false;
    }

    // Re-run initialization code after state restoration (used during deserialization)
    reinitialize() {
        const logic = this.definition.logic;
        
        if (logic.init) {
            try {
                const func = new Function('state', logic.init);
                func(this.state);
            } catch (error) {
                console.error(`Error in reinitialize code for ${this.type}:`, error);
            }
        }
    }
}
