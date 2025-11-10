# Adding New Components to Logico

This guide explains how to add new components to the circuit simulator using the JSON-based component definition system.

## Quick Start - Adding a Simple Component (JSON Only!)

### Step 1: Create a new JSON file

Create a new file in the `components/` folder (e.g., `components/buffer.json`):

```json
{
  "id": "BUFFER",
  "name": "Buffer",
  "category": "Logic Gates",
  "description": "Passes signal through without modification",
  "pins": {
    "inputs": [
      { "x": -30, "y": 0 }
    ],
    "outputs": [
      { "x": 30, "y": 0 }
    ]
  },
  "logic": {
    "code": "outputs[0].setValue(inputs[0].getValue());"
  },
  "rendering": {
    "type": "gate",
    "shape": "triangle",
    "width": 50,
    "height": 30,
    "label": "BUF"
  }
}
```

### Step 2: Reload

Refresh your browser and the component will automatically:
- Appear in the palette
- Be draggable onto the canvas
- Work with save/load
- Work with copy/paste
- Be properly rendered

No code changes needed! Just create a JSON file.

## JSON Component Definition

### Required Fields

```json
{
  "id": "UNIQUE_ID",           // Unique identifier (UPPERCASE)
  "name": "Display Name",      // Name shown in palette
  "category": "Category Name", // Palette category
  "description": "...",        // Tooltip description
  "pins": { ... },            // Pin definitions
  "logic": { ... },           // Logic type
  "rendering": { ... }        // Visual appearance
}
```

### Pin Definitions

```json
"pins": {
  "inputs": [
    { "x": -30, "y": -10, "label": "A" },  // Optional label
    { "x": -30, "y": 10, "label": "B" }
  ],
  "outputs": [
    { "x": 30, "y": 0, "label": "Q" }
  ]
}
```

Coordinates are relative to component center.

### Logic Definition

Define your component's logic using JavaScript code that has access to `inputs`, `outputs`, and `state`:

```json
"logic": {
  "state": {
    "value": false
  },
  "code": "outputs[0].setValue(state.value);",
  "onClick": "state.value = !state.value;"
}
```

**Available in logic code:**
- `inputs` - Array of input Pin objects
- `outputs` - Array of output Pin objects
- `state` - Component state object (persistent across evaluations)
- `timestamp` - Current timestamp (only in `update` code)
- `inputs[i].getValue()` - Get boolean value from input pin
- `outputs[i].setValue(value)` - Set boolean value on output pin

**Logic Properties:**

- **`state`** (optional) - Initial state object. Can contain any properties you need.
- **`init`** (optional) - Initialization code, runs once when component is created. Has access to `state`.
- **`code`** - Main evaluation logic, runs every simulation step. Has access to `inputs`, `outputs`, `state`.
- **`update`** (optional) - Update code for time-based components, runs every frame. Has access to `inputs`, `outputs`, `state`, `timestamp`.
- **`onClick`** (optional) - Click handler for interactive components. Has access to `inputs`, `outputs`, `state`.

**Examples:**

Simple gate (no state):
```json
"logic": {
  "code": "const result = inputs.every(pin => pin.getValue());\noutputs[0].setValue(result);"
}
```

Interactive input (with state and click handler):
```json
"logic": {
  "state": {
    "value": false
  },
  "code": "outputs[0].setValue(state.value);",
  "onClick": "state.value = !state.value;"
}
```

Clock generator (with state and update):
```json
"logic": {
  "state": {
    "value": false,
    "period": 1000,
    "lastToggle": 0
  },
  "code": "outputs[0].setValue(state.value);",
  "update": "if (timestamp - state.lastToggle >= state.period / 2) {\n  state.value = !state.value;\n  state.lastToggle = timestamp;\n  outputs[0].setValue(state.value);\n}"
}
```

Counter (with state):
```json
"logic": {
  "state": {
    "count": 0
  },
  "code": "const clk = inputs[0].getValue();\nconst rst = inputs[1].getValue();\nif (rst) {\n  state.count = 0;\n} else if (clk && !state.lastClk) {\n  state.count = (state.count + 1) % 16;\n}\nstate.lastClk = clk;\nfor (let i = 0; i < 4; i++) {\n  outputs[i].setValue((state.count >> i) & 1);\n}"
}
```

### Rendering Options

#### Shape Types

Logico provides several predefined shapes for components:

**Traditional Logic Gate Shapes:**
```json
"rendering": {
  "type": "gate",
  "shape": "and",      // Traditional AND gate shape
  "width": 60,
  "height": 40,
  "label": "&"
}
```

Available gate shapes:
- **`"and"`** - Classic AND gate shape (flat left, rounded right)
- **`"or"`** - Classic OR gate shape (curved sides)
- **`"xor"`** - Classic XOR gate shape (OR shape with extra input arc)
- **`"nand"`** - AND gate with inversion bubble at output
- **`"nor"`** - OR gate with inversion bubble at output

**Generic Shapes:**

**Rounded Rectangle:**
```json
"rendering": {
  "type": "gate",
  "shape": "rounded-rect",
  "width": 60,
  "height": 40,
  "label": "D-FF"
}
```

**Triangle:**
```json
"rendering": {
  "type": "gate",
  "shape": "triangle",
  "width": 50,
  "height": 30,
  "label": "BUF"
}
```

**Rectangle:**
```json
"rendering": {
  "type": "gate",
  "shape": "rect",
  "width": 60,
  "height": 40,
  "label": "MUX"
}
```

**Circle:**
```json
"rendering": {
  "type": "gate",
  "shape": "circle",
  "width": 30,
  "height": 30,
  "label": "IN"
}
```

#### State-Based Coloring

All shapes automatically change color based on component state:
- Components with outputs show **green** when active, **gray** when inactive
- INPUT and LED components (using circles) change color based on their internal state
- No custom code needed for visual feedback!

#### Custom Rendering (Advanced)

For components that need special visual content (displays, gauges, complex visualizations), you can define custom rendering code for the **content inside the shape**. The basic shape (rounded-rect, circle, etc.) is still drawn automatically, and your custom code only controls what appears inside it.

```json
"rendering": {
  "type": "gate",
  "shape": "rounded-rect",
  "width": 50,
  "height": 50,
  "customRender": "// Draw hex digit inside the rounded rectangle\nconst hexChars = '0123456789ABCDEF';\nconst hexValue = hexChars[state.value];\nctx.fillStyle = '#4ec9b0';\nctx.font = 'bold 24px monospace';\nctx.textAlign = 'center';\nctx.textBaseline = 'middle';\nctx.fillText(hexValue, x, y);\n\n// Small label at top\nctx.fillStyle = colors.text;\nctx.font = '8px monospace';\nctx.fillText('HEX', x, y - height/2 + 10);"
}
```

**What gets drawn automatically:**
- ✅ Component shape (rounded-rect, circle, triangle, etc.)
- ✅ Border and fill colors (handles selection state)
- ✅ Pins
- ✅ Default label (if no customRender)

**What customRender controls:**
- 🎨 Content INSIDE the shape
- 🎨 Custom text, graphics, visualizations
- 🎨 Override the default label with custom content

**Available in customRender code:**
- `ctx` - Canvas 2D context (for drawing)
- `x`, `y` - Component center position
- `width`, `height` - Component dimensions  
- `selected` - Boolean, whether component is selected
- `state` - Component state object
- `colors` - Color palette object with all theme colors

**Common drawing operations:**
```javascript
// Rectangles
ctx.fillRect(x - width/2, y - height/2, width, height);
ctx.strokeRect(x - width/2, y - height/2, width, height);

// Circles
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();

// Text
ctx.fillStyle = '#4ec9b0';
ctx.font = 'bold 24px monospace';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Hello', x, y);

// Paths
ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
```

See `components/hex-display.json` and `components/7-segment-display.json` for complete examples.

## Examples

### 4-Input AND Gate

```json
{
  "id": "AND4",
  "name": "4-Input AND",
  "category": "Logic Gates",
  "description": "AND gate with 4 inputs",
  "pins": {
    "inputs": [
      { "x": -30, "y": -15 },
      { "x": -30, "y": -5 },
      { "x": -30, "y": 5 },
      { "x": -30, "y": 15 }
    ],
    "outputs": [
      { "x": 30, "y": 0 }
    ]
  },
  "logic": {
    "code": "const result = inputs.every(pin => pin.getValue());\noutputs[0].setValue(result);"
  },
  "rendering": {
    "type": "gate",
    "shape": "rounded-rect",
    "width": 60,
    "height": 50,
    "label": "AND4"
  }
}
```

### 3-Input OR Gate

```json
{
  "id": "OR3",
  "name": "3-Input OR",
  "category": "Logic Gates",
  "description": "OR gate with 3 inputs",
  "pins": {
    "inputs": [
      { "x": -30, "y": -10 },
      { "x": -30, "y": 0 },
      { "x": -30, "y": 10 }
    ],
    "outputs": [
      { "x": 30, "y": 0 }
    ]
  },
  "logic": {
    "code": "const result = inputs.some(pin => pin.getValue());\noutputs[0].setValue(result);"
  },
  "rendering": {
    "type": "gate",
    "shape": "rounded-rect",
    "width": 60,
    "height": 40,
    "label": "OR3"
  }
}
```

## Available Shapes

All components use predefined shapes with automatic state-based coloring:

- **Traditional Logic Gates**: `and`, `or`, `xor`, `nand`, `nor`
- **Generic Shapes**: `rounded-rect`, `triangle`, `rect`, `circle`

The renderer automatically handles:
- Drawing the component shape
- Coloring based on state (green = active, gray = inactive)
- Positioning labels
- Drawing pins

**You don't need custom rendering code!** Just pick a shape and define the logic.

## Categories

Components are grouped by category in the palette:
- `"Logic Gates"` - Boolean logic
- `"Input/Output"` - Interface components
- `"Sequential"` - Flip-flops, latches
- `"Arithmetic"` - Adders, ALUs
- `"Memory"` - RAM, ROM, registers
- Or create your own!

## Tips

1. **Everything is data-driven** - Define components entirely in JSON with code blocks
2. **Use state for persistence** - State object persists across evaluations and is saved/loaded
3. **Position pins carefully** - Relative to component center
4. **Test incrementally** - Add one component at a time
5. **Multi-line code** - Use `\n` for readability in JSON
6. **onClick for interactivity** - Add click handlers for buttons, switches, inputs
7. **update for animation** - Use update code for clocks, timers, animations
8. **No JavaScript needed** - 99% of components can be pure JSON!

## File Structure

```
Logico/
├── components/                    # Component definitions (create files here!)
│   ├── and.json
│   ├── or.json
│   ├── not.json
│   ├── your-component.json        # Add your new component here
│   └── ...
├── src/
│   ├── circuit/
│   │   ├── GenericComponent.js    # Handles JSON components
│   │   ├── ComponentRegistry.js   # Loads all JSON files from components/
│   │   └── Subcircuit.js          # Subcircuit wrapper
│   └── renderer/
│       └── Renderer.js            # Rendering (shape-based system)
```

## Workflow

1. **Create JSON file** - Create `components/your-component.json`
2. **Define component** - Add pins, logic code, and rendering shape
3. **Test your code** - Use logic.code for evaluation
4. **Add state if needed** - Use logic.state for persistent data
5. **Add interactivity** - Use logic.onClick for user interaction
6. **Add animation** - Use logic.update for time-based behavior
7. **Reload page** - Component appears automatically!

**No JavaScript files to edit. No code to compile. Pure data-driven design!**

## Example: Complete Component File

Here's `components/multiplexer.json` as a complete example:

```json
{
  "id": "MUX_2TO1",
  "name": "2-to-1 Multiplexer",
  "category": "Logic Gates",
  "description": "Selects between two inputs based on select line",
  "pins": {
    "inputs": [
      { "x": -30, "y": -15, "label": "A" },
      { "x": -30, "y": 0, "label": "B" },
      { "x": -30, "y": 15, "label": "SEL" }
    ],
    "outputs": [
      { "x": 30, "y": 0, "label": "Y" }
    ]
  },
  "logic": {
    "code": "const a = inputs[0].getValue();\nconst b = inputs[1].getValue();\nconst sel = inputs[2].getValue();\noutputs[0].setValue(sel ? b : a);"
  },
  "rendering": {
    "type": "gate",
    "shape": "rounded-rect",
    "width": 60,
    "height": 50,
    "label": "MUX"
  }
}
```

Save this as `components/multiplexer.json`, refresh your browser, and the component is ready to use!
