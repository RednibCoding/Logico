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

    render(circuit, tempWire = null, selectionBox = null, hoveredComponent = null) {
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

        // Draw tooltip (in screen space, after restoring transform)
        if (hoveredComponent) {
            this.drawTooltip(hoveredComponent);
        }
    }

    drawComponent(component) {
        const x = component.x;
        const y = component.y;

        // All components are now GenericComponents with rendering definitions
        if (component instanceof GenericComponent) {
            this.drawGenericFromDef(component);
            return;
        }

        // Only subcircuits use the old rendering path
        if (component.type === 'SUBCIRCUIT') {
            this.ctx.fillStyle = component.selected ? this.colors.componentSelected : this.colors.component;
            this.ctx.strokeStyle = component.selected ? this.colors.wireSelected : this.colors.componentBorder;
            this.ctx.lineWidth = component.selected ? 3 : 2;
            this.drawSubcircuit(x, y, component.width, component.height, component.circuitName, component.selected);
            component.getAllPins().forEach(pin => this.drawPin(pin));
        }

        // Draw label if exists
        if (component.label) {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(component.label, x + component.width / 2, y - 5);
        }
    }

    drawSubcircuit(x, y, w, h, circuitName, selected) {
        // Draw rectangular box (centered like other components)
        this.ctx.fillStyle = selected ? this.colors.componentSelected : '#2d4a5c';
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : '#4a90d9';
        this.ctx.lineWidth = selected ? 3 : 2;
        
        const left = x - w / 2;
        const top = y - h / 2;
        
        this.ctx.fillRect(left, top, w, h);
        this.ctx.strokeRect(left, top, w, h);

        // Draw circuit name
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(circuitName, x, y + 4);
        
        // Draw small icon to indicate it's a subcircuit
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText('⚙', x + w / 2 - 10, top + 12);
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

    // Draw generic component from JSON definition
    drawGenericFromDef(component) {
        const renderDef = component.getRenderingDef();
        const x = component.x;
        const y = component.y;
        const selected = component.selected;

        // All components now use generic shape-based rendering
        const width = renderDef.width || 60;
        const height = renderDef.height || 40;
        const label = renderDef.label || component.type;

        this.ctx.fillStyle = selected ? this.colors.componentSelected : this.colors.component;
        this.ctx.strokeStyle = selected ? this.colors.wireSelected : this.colors.componentBorder;
        this.ctx.lineWidth = selected ? 3 : 2;

        // Draw shape
        switch (renderDef.shape) {
            case 'and':
                // Traditional AND gate shape
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.lineTo(x + width * 0.1, y - height/2);
                this.ctx.arc(x + width * 0.1, y, height / 2, -Math.PI / 2, Math.PI / 2);
                this.ctx.lineTo(x - width/2, y + height/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'or':
                // Traditional OR gate shape
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.quadraticCurveTo(x + width * 0.1, y - height/2, x + width * 0.4, y);
                this.ctx.quadraticCurveTo(x + width * 0.1, y + height/2, x - width/2, y + height/2);
                this.ctx.quadraticCurveTo(x - width * 0.3, y, x - width/2, y - height/2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'xor':
                // Traditional XOR gate shape with extra arc
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2 + 5, y - height/2);
                this.ctx.quadraticCurveTo(x + width * 0.1, y - height/2, x + width * 0.4, y);
                this.ctx.quadraticCurveTo(x + width * 0.1, y + height/2, x - width/2 + 5, y + height/2);
                this.ctx.quadraticCurveTo(x - width * 0.3 + 5, y, x - width/2 + 5, y - height/2);
                this.ctx.fill();
                this.ctx.stroke();
                // Extra arc for XOR
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.quadraticCurveTo(x - width * 0.3, y, x - width/2, y + height/2);
                this.ctx.stroke();
                break;

            case 'nand':
                // AND gate with inversion bubble
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.lineTo(x + width * 0.05, y - height/2);
                this.ctx.arc(x + width * 0.05, y, height / 2, -Math.PI / 2, Math.PI / 2);
                this.ctx.lineTo(x - width/2, y + height/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                // Inversion bubble
                this.ctx.beginPath();
                this.ctx.arc(x + width * 0.35, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'nor':
                // OR gate with inversion bubble
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.quadraticCurveTo(x + width * 0.05, y - height/2, x + width * 0.35, y);
                this.ctx.quadraticCurveTo(x + width * 0.05, y + height/2, x - width/2, y + height/2);
                this.ctx.quadraticCurveTo(x - width * 0.3, y, x - width/2, y - height/2);
                this.ctx.fill();
                this.ctx.stroke();
                // Inversion bubble
                this.ctx.beginPath();
                this.ctx.arc(x + width * 0.42, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'rounded-rect':
                this.ctx.beginPath();
                const radius = 8;
                this.ctx.moveTo(x - width/2 + radius, y - height/2);
                this.ctx.lineTo(x + width/2 - radius, y - height/2);
                this.ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius);
                this.ctx.lineTo(x + width/2, y + height/2 - radius);
                this.ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2);
                this.ctx.lineTo(x - width/2 + radius, y + height/2);
                this.ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius);
                this.ctx.lineTo(x - width/2, y - height/2 + radius);
                this.ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(x - width/2, y - height/2);
                this.ctx.lineTo(x + width/2, y);
                this.ctx.lineTo(x - width/2, y + height/2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'circle':
                // Circle shape - color based on state/value
                const isActive = component.state?.pressed || component.state?.value || component.getValue?.() || false;
                this.ctx.fillStyle = selected ? this.colors.componentSelected : 
                                   (isActive ? this.colors.inputOn : this.colors.inputOff);
                this.ctx.beginPath();
                this.ctx.arc(x, y, Math.min(width, height) / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'rect':
                // Rectangle - color based on state/value for OUTPUT/LED
                const isRectActive = component.getValue?.() || false;
                this.ctx.fillStyle = selected ? this.colors.componentSelected :
                                   (isRectActive ? this.colors.outputOn : this.colors.outputOff);
                this.ctx.fillRect(x - width/2, y - height/2, width, height);
                this.ctx.strokeRect(x - width/2, y - height/2, width, height);
                break;

            default: // default rectangle
                this.ctx.fillRect(x - width/2, y - height/2, width, height);
                this.ctx.strokeRect(x - width/2, y - height/2, width, height);
        }

        // Check if component has custom content rendering
        if (renderDef.customRender) {
            try {
                // Execute custom render code for content INSIDE the shape
                // Provide: ctx, x, y, width, height, selected, state, colors
                const func = new Function(
                    'ctx', 'x', 'y', 'width', 'height', 'selected', 'state', 'colors', 
                    renderDef.customRender
                );
                func(
                    this.ctx,
                    x,
                    y,
                    width,
                    height,
                    selected,
                    component.state,
                    this.colors
                );
                
                // Draw selection border AFTER custom render so it's visible
                if (selected) {
                    this.ctx.strokeStyle = this.colors.wireSelected;
                    this.ctx.lineWidth = 3;
                    // Determine shape for selection border
                    if (renderDef.shape === 'rounded-rect') {
                        this.ctx.beginPath();
                        const r = 8;
                        this.ctx.moveTo(x - width/2 + r, y - height/2);
                        this.ctx.lineTo(x + width/2 - r, y - height/2);
                        this.ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + r);
                        this.ctx.lineTo(x + width/2, y + height/2 - r);
                        this.ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - r, y + height/2);
                        this.ctx.lineTo(x - width/2 + r, y + height/2);
                        this.ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - r);
                        this.ctx.lineTo(x - width/2, y - height/2 + r);
                        this.ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + r, y - height/2);
                        this.ctx.closePath();
                        this.ctx.stroke();
                    } else if (renderDef.shape === 'circle') {
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, Math.min(width, height) / 2, 0, Math.PI * 2);
                        this.ctx.stroke();
                    } else {
                        // Default rectangle
                        this.ctx.strokeRect(x - width/2, y - height/2, width, height);
                    }
                }
            } catch (error) {
                console.error(`Error in custom render code for ${component.type}:`, error);
                // Fall through to default label rendering on error
            }
        } else {
            // Draw default label
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Adjust label position based on shape
            let labelX = x;
            if (renderDef.shape === 'and' || renderDef.shape === 'nand') {
                labelX = x - width * 0.1; // Shift slightly left for AND shapes
            } else if (renderDef.shape === 'or' || renderDef.shape === 'nor' || renderDef.shape === 'xor') {
                labelX = x - width * 0.1; // Shift more left for OR shapes
            } else if (renderDef.shape === 'triangle') {
                labelX = x - width * 0.25; // Shift more left for triangle (NOT/BUFFER)
            }
            
            this.ctx.fillText(label, labelX, y);
        }

        // Draw pins
        component.getAllPins().forEach(pin => this.drawPin(pin, selected));
    }

    drawTooltip(component) {
        // Get component definition for description
        let name = component.type;
        let description = '';

        if (component instanceof GenericComponent && component.definition) {
            name = component.definition.name || component.type;
            description = component.definition.description || '';
        } else if (component.type === 'SUBCIRCUIT') {
            name = component.circuitName;
            description = 'Subcircuit component';
        }

        if (!description) return; // Don't show tooltip if no description

        // Convert component position to screen space
        const screenPos = this.worldToScreen(
            component.x + component.width / 2,
            component.y + component.height + 10
        );

        // Measure text
        this.ctx.font = 'bold 12px sans-serif';
        const nameWidth = this.ctx.measureText(name).width;
        this.ctx.font = '11px sans-serif';
        const descWidth = this.ctx.measureText(description).width;
        const maxWidth = Math.max(nameWidth, descWidth);

        const padding = 8;
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = 40;

        // Adjust position to keep tooltip on screen
        let tooltipX = screenPos.x - tooltipWidth / 2;
        let tooltipY = screenPos.y;

        if (tooltipX < 10) tooltipX = 10;
        if (tooltipX + tooltipWidth > this.width - 10) {
            tooltipX = this.width - tooltipWidth - 10;
        }
        if (tooltipY + tooltipHeight > this.height - 10) {
            tooltipY = screenPos.y - tooltipHeight - 20;
        }

        // Draw tooltip background with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillStyle = 'rgba(45, 45, 48, 0.95)';
        this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Draw border
        this.ctx.strokeStyle = '#569cd6';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

        // Draw text
        this.ctx.fillStyle = '#d4d4d4';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Component name (bold)
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillText(name, tooltipX + padding, tooltipY + padding);

        // Description
        this.ctx.font = '11px sans-serif';
        this.ctx.fillStyle = '#a0a0a0';
        this.ctx.fillText(description, tooltipX + padding, tooltipY + padding + 18);
    }
}
