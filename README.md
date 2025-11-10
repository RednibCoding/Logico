# Logico - Logic Circuit Simulator

A web-based logic circuit simulator similar to Logisim, built with HTML5 Canvas and JavaScript.

## Try it
https://rednibcoding.github.io/Logico/

## Features

- **Drag-and-drop component placement** - Add logic gates and I/O components from the palette
- **Wire connections** - Draw wires between component pins by dragging from output to input
- **Real-time simulation** - Live circuit evaluation with visual feedback
- **Interactive inputs** - Double-click input pins to toggle their state
- **LED indicators** - Visual output display with LEDs
- **Clock signals** - Periodic signal generator for sequential circuits
- **Multiple circuits and subcircuits** - Create reusable circuit components
- **Component library** - AND, OR, NOT, XOR, NAND, NOR gates, plus inputs, outputs, LEDs, and clock signals
- **Visual feedback** - Active wires and pins are highlighted during simulation
- **Selection system** - Select multiple components and wires with click, Ctrl+click, or selection box
- **Zoom and pan** - Mouse wheel to zoom (cursor-centered), right-click to pan
- **Grid snapping** - Components snap to 40px grid for clean layouts
- **Copy/Paste/Cut** - Full clipboard support with Ctrl+C/V/X
- **Group operations** - Move, copy, and delete multiple selected components together
- **Save/Load projects** - Save entire projects with File System Access API
- **Import/Export subcircuits** - Share reusable subcircuits as separate files

## Getting Started

1. Open `index.html` in a modern web browser
2. Drag components from the left palette onto the canvas
3. Click and drag from an output pin (circle) to an input pin (square) to create wires
4. Double-click input pins or clocks to toggle their state
5. Click "Simulate" to start real-time simulation
6. Use the toolbar to save/load projects and manage circuits

## Controls

### Mouse
- **Left-click** - Select components/wires
- **Left-click + drag** - Move components (all selected components move together)
- **Ctrl/Cmd + click** - Multi-select (add/remove from selection)
- **Click and drag on empty space** - Draw selection box
- **Right-click + drag** - Pan the workspace
- **Mouse wheel** - Zoom in/out (centered on cursor)
- **Double-click input/clock** - Toggle component state
- **Drag from output pin** - Start wire drawing
- **Drag to input pin** - Complete wire connection

### Keyboard
- **Delete/Backspace** - Delete selected items
- **Ctrl/Cmd + A** - Select all
- **Ctrl/Cmd + C** - Copy selection
- **Ctrl/Cmd + X** - Cut selection
- **Ctrl/Cmd + V** - Paste from clipboard
- **Escape** - Clear selection/cancel wire drawing

### Toolbar
- **Simulate** - Start real-time circuit simulation
- **Stop** - Stop simulation
- **Clear** - Clear current circuit
- **Save** - Save entire project to .logico file
- **Load** - Load project from file
- **Import Subcircuit** - Import a .subcircuit file
- **New Circuit** - Create new circuit/subcircuit
- **Circuit dropdown** - Switch between circuits

### Subcircuit Management
- **Export button** (down arrow) - Export subcircuit to file
- **Delete button** (x) - Delete subcircuit (checks for dependencies)

## Project Structure

```
Logico/
├── index.html              # Main HTML file
├── styles.css              # Dark theme styling
├── main.js                 # Entry point
├── components/             # Component definitions (individual JSON files)
│   ├── and.json
│   ├── or.json
│   ├── not.json
│   ├── xor.json
│   ├── nand.json
│   ├── nor.json
│   ├── buffer.json
│   ├── input.json
│   ├── output.json
│   ├── clock.json
│   ├── led.json
│   └── d-flip-flop.json
├── ADDING_COMPONENTS.md    # Guide for adding new components
├── LICENSE.md              # MIT License
├── src/
│   ├── core/
│   │   ├── Pin.js          # Pin class (connection points)
│   │   ├── Component.js    # Base component class
│   │   ├── Wire.js         # Wire class (connections)
│   │   └── Circuit.js      # Circuit management
│   ├── circuit/
│   │   ├── GenericComponent.js  # Data-driven component (loads from JSON)
│   │   ├── ComponentRegistry.js # Component management and JSON loading
│   │   └── Subcircuit.js        # Subcircuit component wrapper
│   ├── engine/
│   │   └── Simulator.js    # Simulation engine with topological sort
│   ├── renderer/
│   │   └── Renderer.js     # Canvas rendering with zoom/pan
│   ├── ui/
│   │   ├── InteractionManager.js  # User interaction and clipboard
│   │   └── Modal.js        # Modal dialogs (alerts, prompts, confirmations)
│   └── app/
│       └── App.js          # Main application logic
```

## Architecture

### Data-Driven Design

Logico uses a **fully data-driven architecture** where components are defined in individual JSON files in the `components/` folder rather than hardcoded in JavaScript. This means:

- **No code changes needed** to add new components - just create a new JSON file
- **Logic defined as code blocks** in JSON - arbitrary JavaScript executed at runtime
- **State management** built-in - components can have persistent state objects
- **Event handlers** - onClick, update, init code blocks for interactivity
- **Predefined shapes** - AND, OR, XOR, NAND, NOR gate shapes plus circle, rect, rounded-rect, triangle

### Core Classes

- **GenericComponent**: Dynamic component class that loads behavior from JSON definitions
- **ComponentRegistry**: Loads and manages components from individual JSON files in `components/` folder
- **Pin**: Represents connection points on components (inputs are squares, outputs are circles)
- **Component**: Base class for all circuit components with serialization support
- **Wire**: Connects two pins and transmits logical values
- **Circuit**: Manages components and wires in a workspace

### Component Definitions (components/*.json)

Each component is defined in its own JSON file in the `components/` folder. Components are defined with:
- **pins**: Input/output pin positions (relative to component)
- **logic.code**: JavaScript code for evaluation (has access to inputs, outputs, state)
- **logic.state**: Persistent state object (for interactive/stateful components)
- **logic.onClick**: Click handler code (for buttons, switches)
- **logic.update**: Per-frame update code (for clocks, animations)
- **rendering.shape**: Predefined shape (and, or, xor, nand, nor, rounded-rect, triangle, rect, circle)
- **rendering.width/height**: Component dimensions

Example from `components/and.json`:
```json
{
  "id": "AND",
  "name": "AND Gate",
  "category": "Logic Gates",
  "description": "Outputs true only when all inputs are true",
  "pins": {
    "inputs": [{"x": -30, "y": -10}, {"x": -30, "y": 10}],
    "outputs": [{"x": 30, "y": 0}]
  },
  "logic": {
    "code": "const result = inputs.every(pin => pin.getValue());\noutputs[0].setValue(result);"
  },
  "rendering": {
    "type": "gate",
    "shape": "and",
    "width": 60,
    "height": 40,
    "label": "&"
  }
}
```

### Component Types

All components are loaded from individual JSON files in `components/`:
- **Logic Gates**: AND, OR, NOT, XOR, NAND, NOR, Buffer (traditional gate shapes)
- **Input Pin**: User-controllable input with onClick handler (`input.json`)
- **Output Pin**: Displays output value (`output.json`)
- **Clock**: Generates periodic signals using update handler (`clock.json`)
- **LED**: Visual indicator (`led.json`)
- **D Flip-Flop**: Sequential logic with state (`d-flip-flop.json`)
- **Subcircuit**: Reusable circuit component (still uses custom class)

### Simulation

The simulator uses topological sorting to determine the correct evaluation order of components, ensuring proper signal propagation through the circuit. The simulation runs in real-time using requestAnimationFrame for smooth updates.

### Subcircuits

Subcircuits allow you to create reusable components:
1. Create a new circuit (automatically becomes a subcircuit)
2. Add INPUT and OUTPUT components to define the interface
3. Build your logic inside the subcircuit
4. Use the subcircuit as a component in other circuits
5. Export subcircuits to share them across projects

### File Formats

- **.logico** - Complete project file containing all circuits and subcircuits
- **.subcircuit** - Individual subcircuit export for sharing and reuse

Both formats use JSON and support:
- Component positions and states
- Wire connections
- Subcircuit hierarchies
- Circuit metadata

## Browser Compatibility

- **Modern browsers** - Uses File System Access API for native save/load dialogs
- **Fallback support** - Traditional file download/upload for older browsers
- **Required features** - HTML5 Canvas, ES6 JavaScript

## Development

This is a pure vanilla JavaScript project with no build system required. Simply edit the files and refresh your browser to see changes.

### Adding New Components

**The easy way (no coding!):**
1. Create a new JSON file in `components/` folder (e.g., `my-component.json`)
2. Define your component with pins, logic code, and rendering
3. Refresh browser - component appears automatically!

See `ADDING_COMPONENTS.md` for detailed documentation.

**Available logic code features:**
- Access to `inputs` (array of input pins)
- Access to `outputs` (array of output pins)
- Access to `state` (persistent object)
- `timestamp` available in update code
- Call `inputs[i].getValue()` and `outputs[i].setValue(value)`

**Predefined shapes:**
- `"and"` - Traditional AND gate
- `"or"` - Traditional OR gate
- `"xor"` - XOR gate with extra arc
- `"nand"` - AND with inversion bubble
- `"nor"` - OR with inversion bubble
- `"rounded-rect"` - Rounded rectangle
- `"triangle"` - Triangle (for buffers/NOT)
- `"rect"` - Plain rectangle
- `"circle"` - Circle (for inputs/LEDs)

**When you need JavaScript:**
Only for custom rendering or extremely complex logic. 99% of components can be pure JSON!

### Code Style

- Uses ES6 classes and modules (via script tags)
- Dark VS Code-inspired theme
- **Data-driven architecture** - components defined in JSON
- Component-based architecture
- Event-driven interaction system
- No build tools required - pure vanilla JavaScript

## Future Enhancements

- Multi-bit wires (buses)
- More components via JSON (multiplexers, decoders, encoders, adders, etc.)
- Additional flip-flops (JK, T, SR) - all definable in JSON
- Timing diagrams and waveform viewer
- Component properties panel (edit state, period, etc.)
- Undo/Redo system
- Wire routing improvements (auto-routing)
- Testing and validation tools
- Performance optimizations for large circuits
- Export circuits as images

## License

MIT License - Feel free to use and modify!
