// Base Component class
class Component {
    static nextId = 0;

    constructor(type, x, y, width, height) {
        this.id = Component.nextId++;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.inputPins = [];
        this.outputPins = [];
        this.selected = false;
        this.label = '';
    }

    // Override in subclasses to define component logic
    evaluate() {
        // Default: do nothing
    }

    // Add an input pin at a specific offset
    addInputPin(offsetX, offsetY, label = '') {
        const pin = new Pin(this, 'input', this.inputPins.length, offsetX, offsetY, label);
        this.inputPins.push(pin);
        return pin;
    }

    // Add an output pin at a specific offset
    addOutputPin(offsetX, offsetY, label = '') {
        const pin = new Pin(this, 'output', this.outputPins.length, offsetX, offsetY, label);
        this.outputPins.push(pin);
        return pin;
    }

    // Get all pins
    getAllPins() {
        return [...this.inputPins, ...this.outputPins];
    }

    // Check if a point is inside the component
    containsPoint(x, y) {
        // Components are centered at (this.x, this.y)
        return x >= this.x - this.width / 2 && x <= this.x + this.width / 2 &&
               y >= this.y - this.height / 2 && y <= this.y + this.height / 2;
    }

    // Find pin at a specific point
    getPinAtPoint(x, y) {
        for (let pin of this.getAllPins()) {
            if (pin.containsPoint(x, y)) {
                return pin;
            }
        }
        return null;
    }

    // Move component
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    // Clone component (useful for subcircuits)
    clone() {
        const cloned = new this.constructor(this.x, this.y);
        cloned.label = this.label;
        return cloned;
    }

    // Serialize for saving
    serialize() {
        const data = {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            label: this.label
        };
        
        // Include state if it exists
        if (this.state !== undefined) {
            data.state = this.state;
        }
        
        return data;
    }
}
