# Logico - Logic Circuit Simulator

A web-based logic circuit simulator similar to Logisim, built with HTML5 Canvas and JavaScript.

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
├── src/
│   ├── core/
│   │   ├── Pin.js          # Pin class (connection points)
│   │   ├── Component.js    # Base component class
│   │   ├── Wire.js         # Wire class (connections)
│   │   └── Circuit.js      # Circuit management
│   ├── components/
│   │   ├── LogicGates.js   # Gate implementations (AND, OR, NOT, XOR, NAND, NOR)
│   │   ├── InputOutput.js  # I/O components (Input, Output, Clock, LED)
│   │   └── Subcircuit.js   # Subcircuit component wrapper
│   ├── engine/
│   │   └── Simulator.js    # Simulation engine with topological sort
│   ├── renderer/
│   │   └── Renderer.js     # Canvas rendering with zoom/pan
│   ├── ui/
│   │   └── InteractionManager.js  # User interaction and clipboard
│   └── app/
│       └── App.js          # Main application logic
```

## Architecture

### Core Classes

- **Pin**: Represents connection points on components (inputs are squares, outputs are circles)
- **Component**: Base class for all circuit components with serialization support
- **Wire**: Connects two pins and transmits logical values
- **Circuit**: Manages components and wires in a workspace

### Component Types

- **Logic Gates**: AND, OR, NOT, XOR, NAND, NOR
- **Input Pin**: User-controllable input (double-click to toggle)
- **Output Pin**: Displays output value
- **Clock**: Generates periodic signals (double-click to toggle)
- **LED**: Visual indicator that lights up when receiving true signal
- **Subcircuit**: Reusable circuit component with internal logic

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

1. Create a new class extending `Component` in the appropriate file
2. Implement `setupPins()` to define input/output pins
3. Implement `evaluate()` to define component logic
4. Add rendering logic in `Renderer.js` (create a `drawYourComponent` method)
5. Add to component factory in `InteractionManager.addComponent()`
6. Optionally add to the palette in `index.html`

### Code Style

- Uses ES6 classes and modules (via script tags)
- Dark VS Code-inspired theme
- Component-based architecture
- Event-driven interaction system

## Future Enhancements

- Multi-bit wires (buses)
- More components (flip-flops, registers, multiplexers, RAM, ROM, etc.)
- Timing diagrams and waveform viewer
- Component properties panel
- Undo/Redo system
- Wire routing improvements (auto-routing)
- Component labels and annotations
- Custom component creation UI
- Testing and validation tools
- Performance optimizations for large circuits

## License

MIT License - Feel free to use and modify!
