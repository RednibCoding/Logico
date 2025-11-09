// Wire class - connects two pins
class Wire {
    static nextId = 0;

    constructor(fromPin, toPin) {
        this.id = Wire.nextId++;
        this.fromPin = fromPin; // output pin
        this.toPin = toPin;     // input pin
        this.selected = false;
        this.waypoints = []; // For future: manual wire routing

        // Connect to pins
        if (fromPin) fromPin.connectWire(this);
        if (toPin) toPin.connectWire(this);
    }

    // Get the current value being transmitted
    getValue() {
        return this.fromPin ? this.fromPin.getValue() : false;
    }

    // Get wire path for rendering
    getPath() {
        if (!this.fromPin || !this.toPin) {
            return [];
        }

        const from = this.fromPin.getPosition();
        const to = this.toPin.getPosition();

        // Simple orthogonal routing
        const midX = (from.x + to.x) / 2;

        return [
            { x: from.x, y: from.y },
            { x: midX, y: from.y },
            { x: midX, y: to.y },
            { x: to.x, y: to.y }
        ];
    }

    // Check if a point is near the wire
    containsPoint(x, y, threshold = 5) {
        const path = this.getPath();
        for (let i = 0; i < path.length - 1; i++) {
            if (this.isPointNearSegment(x, y, path[i], path[i + 1], threshold)) {
                return true;
            }
        }
        return false;
    }

    isPointNearSegment(px, py, p1, p2, threshold) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
            const dist = Math.sqrt((px - p1.x) ** 2 + (py - p1.y) ** 2);
            return dist <= threshold;
        }

        const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / (length * length)));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
        
        return dist <= threshold;
    }

    // Disconnect this wire
    disconnect() {
        if (this.fromPin) {
            this.fromPin.disconnectWire(this);
        }
        if (this.toPin) {
            this.toPin.disconnectWire(this);
        }
    }

    // Serialize for saving
    serialize() {
        return {
            id: this.id,
            from: {
                componentId: this.fromPin.component.id,
                pinIndex: this.fromPin.index,
                pinType: 'output'
            },
            to: {
                componentId: this.toPin.component.id,
                pinIndex: this.toPin.index,
                pinType: 'input'
            }
        };
    }
}
