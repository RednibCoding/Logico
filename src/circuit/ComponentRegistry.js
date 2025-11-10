// Component Registry - Centralized component definitions
class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.categories = new Map();
        this.componentDefinitions = new Map(); // Store JSON definitions
    }

    // Initialize - load components from individual JSON files
    async init() {
        const componentFiles = [
            'components/and.json',
            'components/or.json',
            'components/not.json',
            'components/xor.json',
            'components/nand.json',
            'components/nor.json',
            'components/buffer.json',
            'components/input.json',
            'components/output.json',
            'components/clock.json',
            'components/led.json',
            'components/d-flip-flop.json'
        ];

        for (const file of componentFiles) {
            await this.loadComponentFromJSON(file);
        }
    }

    // Load a single component definition from JSON file
    async loadComponentFromJSON(url) {
        try {
            const response = await fetch(url);
            const def = await response.json();
            
            this.componentDefinitions.set(def.id, def);
            
            // All components use GenericComponent
            this.register({
                id: def.id,
                name: def.name,
                category: def.category,
                class: GenericComponent,
                description: def.description,
                definition: def
            });
        } catch (error) {
            console.error(`Failed to load component from ${url}:`, error);
        }
    }

    // Register a component type
    register(config) {
        const {
            id,              // Unique identifier (e.g., 'AND')
            name,            // Display name (e.g., 'AND Gate')
            category,        // Category for palette grouping
            class: ComponentClass,  // The component class
            icon,            // Optional icon character
            description,     // Optional description
            definition       // JSON definition
        } = config;

        this.components.set(id, {
            id,
            name,
            category,
            class: ComponentClass,
            icon: icon || null,
            description: description || '',
            definition: definition || null
        });

        // Add to category
        if (!this.categories.has(category)) {
            this.categories.set(category, []);
        }
        this.categories.get(category).push(id);
    }

    // Get component definition
    get(id) {
        return this.components.get(id);
    }

    // Get JSON definition
    getDefinition(id) {
        return this.componentDefinitions.get(id);
    }

    // Create a component instance
    create(id, x, y, ...args) {
        const def = this.components.get(id);
        if (!def) {
            console.error(`Component type "${id}" not found`);
            return null;
        }

        // Get JSON definition
        const jsonDef = this.componentDefinitions.get(id);
        
        // All components now use GenericComponent with JSON definition
        if (jsonDef) {
            return new GenericComponent(x, y, jsonDef);
        }

        // Fallback to class-based creation (for subcircuits)
        if (def.class) {
            return new def.class(x, y, ...args);
        }

        return null;
    }

    // Get all components in a category
    getCategory(category) {
        const ids = this.categories.get(category) || [];
        return ids.map(id => this.components.get(id));
    }

    // Get all categories
    getAllCategories() {
        return Array.from(this.categories.keys());
    }

    // Get all components
    getAll() {
        return Array.from(this.components.values());
    }

    // Register a subcircuit dynamically
    registerSubcircuit(name, circuitInstance) {
        const id = 'SUBCIRCUIT_' + name;
        
        // Remove if already registered
        if (this.components.has(id)) {
            this.unregister(id);
        }

        this.register({
            id: id,
            name: name,
            category: 'Subcircuits',
            class: SubcircuitComponent,
            description: `Subcircuit: ${name}`
        });

        // Store circuit instance for later use
        const def = this.components.get(id);
        def.circuitInstance = circuitInstance;
    }

    // Unregister a component (useful for removing subcircuits)
    unregister(id) {
        const def = this.components.get(id);
        if (!def) return;

        // Remove from category
        const categoryIds = this.categories.get(def.category);
        if (categoryIds) {
            const index = categoryIds.indexOf(id);
            if (index > -1) {
                categoryIds.splice(index, 1);
            }
            // Remove category if empty
            if (categoryIds.length === 0) {
                this.categories.delete(def.category);
            }
        }

        this.components.delete(id);
    }
}
