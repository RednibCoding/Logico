// Pin class - represents connection points on components
class Pin {
    constructor(component, type, index, offsetX, offsetY, label = '') {
        this.component = component;
        this.type = type; // 'input' or 'output'
        this.index = index;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.label = label; // Label for this pin
        this.value = false; // logical value (true/false or 1/0)
        this.connectedWires = []; // wires connected to this pin
    }

    getPosition() {
        return {
            x: this.component.x + this.offsetX,
            y: this.component.y + this.offsetY
        };
    }

    setValue(value) {
        if (this.value !== value) {
            this.value = value;
            // Propagate changes through connected wires
            if (this.type === 'output') {
                this.connectedWires.forEach(wire => {
                    if (wire.fromPin === this) {
                        wire.toPin.setValue(value);
                    }
                });
            }
        }
    }

    getValue() {
        // If this is an input pin with no connections, return false
        if (this.type === 'input' && this.connectedWires.length === 0) {
            return false;
        }
        return this.value;
    }

    connectWire(wire) {
        if (!this.connectedWires.includes(wire)) {
            this.connectedWires.push(wire);
        }
    }

    disconnectWire(wire) {
        const index = this.connectedWires.indexOf(wire);
        if (index > -1) {
            this.connectedWires.splice(index, 1);
            // Reset input pin value when disconnected
            if (this.type === 'input') {
                this.value = false;
            }
        }
    }

    // Check if a point is near this pin (for interaction)
    containsPoint(x, y, threshold = 8) {
        const pos = this.getPosition();
        const dx = x - pos.x;
        const dy = y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }
}
