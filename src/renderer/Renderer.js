// Renderer - draws the circuit on canvas
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;
        this.offsetX = 0;
        this.offsetY = 0;
        this.gridSize = 20;
        this.showGrid = true;

        // Colors
        this.colors = {
            background: '#1e1e1e',
            grid: '#2d2d30',
            component: '#3c3c3c',
            componentBorder: '#569cd6',
            componentSelected: '#094771',
            wire: '#858585',
            wireActive: '#4ec9b0',
            wireSelected: '#ffd700',
            pin: '#d4d4d4',
            pinActive: '#4ec9b0',
            text: '#d4d4d4',
            inputOff: '#3c3c3c',
            inputOn: '#4ec9b0',
            outputOff: '#3c3c3c',
            outputOn: '#4ec9b0'
        };

        this.resize();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawGrid() {
        if (!this.showGrid) return;

        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1 / this.scale;

        const scaledGrid = this.gridSize;
        const startX = Math.floor(-this.offsetX / this.scale / scaledGrid) * scaledGrid;
        const startY = Math.floor(-this.offsetY / this.scale / scaledGrid) * scaledGrid;
        const endX = startX + (this.width / this.scale) + scaledGrid;
        const endY = startY + (this.height / this.scale) + scaledGrid;

        // Vertical lines
        for (let x = startX; x < endX; x += scaledGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += scaledGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    render(circuit, tempWire = null, selectionBox = null) {
        if (!circuit) return; // Guard against undefined circuit
        
        this.clear();
        
        // Apply transformations
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.drawGrid();

        // Draw wires
        circuit.wires.forEach(wire => this.drawWire(wire));

        // Draw temporary wire (while dragging)
        if (tempWire) {
            this.drawTemporaryWire(tempWire.from, tempWire.to);
        }

        // Draw components
        circuit.components.forEach(component => this.drawComponent(component));
        
        // Draw selection box
        if (selectionBox) {
            this.drawSelectionBox(selectionBox.start, selectionBox.end);
        }
        
        this.ctx.restore();
    }

    drawComponent(component) {
        const x = component.x;
        const y = component.y;

        // Component body - use yellow border when selected
        this.ctx.fillStyle = component.selected ? this.colors.componentSelected : this.colors.component;
        this.ctx.strokeStyle = component.selected ? this.colors.wireSelected : this.colors.componentBorder;
        this.ctx.lineWidth = component.selected ? 3 : 2;

        // Draw based on type
        switch (component.type) {
            case 'AND':
                this.drawANDGate(x, y, component.width, component.height, component.selected);
                break;
            case 'OR':
                this.drawORGate(x, y, component.width, component.height, component.selected);
                break;
            case 'NOT':
                this.drawNOTGate(x, y, component.width, component.height, component.selected);
                break;
            case 'XOR':
                this.drawXORGate(x, y, component.width, component.height, component.selected);
                break;
            case 'NAND':
                this.drawNANDGate(x, y, component.width, component.height, component.selected);
                break;
            case 'NOR':
                this.drawNORGate(x, y, component.width, component.height, component.selected);
                break;
            case 'INPUT':
                this.drawInputPin(x, y, component.width, component.height, component.state, component.selected);
                break;
            case 'OUTPUT':
                this.drawOutputPin(x, y, component.width, component.height, component.getValue(), component.selected);
                break;
            case 'CLOCK':
                this.drawClock(x, y, component.width, component.height, component.state, component.selected);
                break;
            case 'LED':
                this.drawLED(x, y, component.width, component.height, component.getValue(), component.selected);
                break;
            case 'SUBCIRCUIT':
                this.drawSubcircuit(x, y, component.width, component.height, component.circuitName, component.selected);
                break;
            default:
                this.drawGenericComponent(x, y, component.width, component.height, component.type, component.selected);
        }

        // Draw pins
        component.getAllPins().forEach(pin => this.drawPin(pin));

        // Draw label if exists
        if (component.label) {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(component.label, x + component.width / 2, y - 5);
        }
    }

    drawANDGate(x, y, w, h, selected) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + w * 0.6, y);
        this.ctx.arc(x + w * 0.6, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
        this.ctx.lineTo(x, y + h);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('&', x + w * 0.4, y + h / 2 + 4);
    }

    drawORGate(x, y, w, h, selected) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x + w * 0.6, y, x + w * 0.9, y + h / 2);
        this.ctx.quadraticCurveTo(x + w * 0.6, y + h, x, y + h);
        this.ctx.quadraticCurveTo(x + w * 0.2, y + h / 2, x, y);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('≥1', x + w * 0.5, y + h / 2 + 4);
    }

    drawNOTGate(x, y, w, h, selected) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + w - 6, y + h / 2);
        this.ctx.lineTo(x, y + h);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Bubble
        this.ctx.beginPath();
        this.ctx.arc(x + w - 3, y + h / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('1', x + w * 0.3, y + h / 2 + 4);
    }

    drawXORGate(x, y, w, h, selected) {
        // Draw OR gate shape
        this.drawORGate(x, y, w, h, selected);
        
        // Add extra curve for XOR
        this.ctx.beginPath();
        this.ctx.moveTo(x - 4, y);
        this.ctx.quadraticCurveTo(x + w * 0.15, y + h / 2, x - 4, y + h);
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('=1', x + w * 0.5, y + h / 2 + 4);
    }

    drawNANDGate(x, y, w, h, selected) {
        this.drawANDGate(x, y, w - 6, h, selected);
        
        // Bubble
        this.ctx.beginPath();
        this.ctx.arc(x + w - 3, y + h / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawNORGate(x, y, w, h, selected) {
        this.drawORGate(x, y, w - 6, h, selected);
        
        // Bubble
        this.ctx.beginPath();
        this.ctx.arc(x + w - 3, y + h / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawInputPin(x, y, w, h, state, selected) {
        this.ctx.fillStyle = state ? this.colors.inputOn : this.colors.inputOff;
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : this.colors.componentBorder;
        this.ctx.lineWidth = selected ? 3 : 2;
        
        this.ctx.beginPath();
        this.ctx.arc(x + w / 2, y + h / 2, h / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(state ? '1' : '0', x + w / 2, y + h / 2 + 5);
    }

    drawOutputPin(x, y, w, h, state, selected) {
        this.ctx.fillStyle = state ? this.colors.outputOn : this.colors.outputOff;
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : this.colors.componentBorder;
        this.ctx.lineWidth = selected ? 3 : 2;
        
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(state ? '1' : '0', x + w / 2, y + h / 2 + 5);
    }

    drawClock(x, y, w, h, state, selected) {
        this.ctx.fillStyle = state ? this.colors.inputOn : this.colors.inputOff;
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : this.colors.componentBorder;
        this.ctx.lineWidth = selected ? 3 : 2;
        
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);

        // Draw clock wave
        this.ctx.strokeStyle = this.colors.text;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + h - 5);
        this.ctx.lineTo(x + 5, y + 5);
        this.ctx.lineTo(x + w / 2, y + 5);
        this.ctx.lineTo(x + w / 2, y + h - 5);
        this.ctx.lineTo(x + w - 5, y + h - 5);
        this.ctx.stroke();
    }

    drawLED(x, y, w, h, state, selected) {
        // Draw LED circle
        this.ctx.fillStyle = state ? '#ff4444' : '#4a1a1a';
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : '#888888';
        this.ctx.lineWidth = selected ? 3 : 2;
        
        this.ctx.beginPath();
        this.ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Add glow effect when on
        if (state) {
            this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x + w / 2, y + h / 2, w / 2 + 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawGenericComponent(x, y, w, h, type, selected) {
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(type, x + w / 2, y + h / 2 + 4);
    }

    drawSubcircuit(x, y, w, h, circuitName, selected) {
        // Draw rectangular box
        this.ctx.fillStyle = selected ? this.colors.componentSelected : '#2d4a5c';
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : '#4a90d9';
        this.ctx.lineWidth = selected ? 3 : 2;
        
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);

        // Draw circuit name
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(circuitName, x + w / 2, y + h / 2 + 4);
        
        // Draw small icon to indicate it's a subcircuit
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText('⚙', x + w - 10, y + 12);
    }

    drawPin(pin) {
        const pos = pin.getPosition();
        const x = pos.x;
        const y = pos.y;

        this.ctx.fillStyle = pin.value ? this.colors.pinActive : this.colors.pin;
        this.ctx.strokeStyle = pin.value ? this.colors.pinActive : this.colors.componentBorder;
        this.ctx.lineWidth = 1.5;
        
        if (pin.type === 'input') {
            // Input pins are squares
            const size = 6;
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
            this.ctx.strokeRect(x - size/2, y - size/2, size, size);
        } else {
            // Output pins are circles
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    drawWire(wire) {
        const path = wire.getPath();
        if (path.length < 2) return;

        const value = wire.getValue();
        this.ctx.strokeStyle = wire.selected ? this.colors.wireSelected :
                               value ? this.colors.wireActive : this.colors.wire;
        this.ctx.lineWidth = (value ? 3 : 2) / this.scale;

        this.ctx.beginPath();
        const start = path[0];
        this.ctx.moveTo(start.x, start.y);
        
        for (let i = 1; i < path.length; i++) {
            const point = path[i];
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
    }

    drawTemporaryWire(from, to) {
        this.ctx.strokeStyle = this.colors.wire;
        this.ctx.lineWidth = 2 / this.scale;
        this.ctx.setLineDash([5 / this.scale, 5 / this.scale]);

        const midX = (from.x + to.x) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(midX, from.y);
        this.ctx.lineTo(midX, to.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawSelectionBox(start, end) {
        const x1 = Math.min(start.x, end.x);
        const y1 = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        // Draw semi-transparent fill
        this.ctx.fillStyle = 'rgba(65, 150, 220, 0.15)';
        this.ctx.fillRect(x1, y1, width, height);

        // Draw border
        this.ctx.strokeStyle = '#4196dc';
        this.ctx.lineWidth = 1.5 / this.scale;
        this.ctx.setLineDash([5 / this.scale, 3 / this.scale]);
        this.ctx.strokeRect(x1, y1, width, height);
        this.ctx.setLineDash([]);
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY
        };
    }

    // Zoom to a specific point (typically mouse cursor)
    zoomTo(x, y, delta) {
        const oldScale = this.scale;
        
        // Calculate new scale
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        let newScale = this.scale * zoomFactor;
        
        // Clamp scale
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        
        if (newScale === this.scale) return; // No change
        
        // Adjust offset to zoom to cursor position
        const worldPos = this.screenToWorld(x, y);
        this.scale = newScale;
        const newScreenPos = this.worldToScreen(worldPos.x, worldPos.y);
        
        this.offsetX += x - newScreenPos.x;
        this.offsetY += y - newScreenPos.y;
    }
}
