// Input/Output components

class InputPin extends Component {
    constructor(x, y) {
        super('INPUT', x, y, 50, 30);
        this.state = false; // User-controllable state
        this.setupPins();
    }

    setupPins() {
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        this.outputPins[0].setValue(this.state);
    }

    toggle() {
        this.state = !this.state;
        this.evaluate();
    }

    setState(value) {
        this.state = value;
        this.evaluate();
    }
}

class OutputPin extends Component {
    constructor(x, y) {
        super('OUTPUT', x, y, 50, 30);
        this.setupPins();
    }

    setupPins() {
        this.addInputPin(0, this.height / 2);
    }

    evaluate() {
        // Output pins just display the input value
        // No need to set anything
    }

    getValue() {
        return this.inputPins[0].getValue();
    }
}

class Clock extends Component {
    constructor(x, y) {
        super('CLOCK', x, y, 50, 30);
        this.state = false;
        this.period = 1000; // milliseconds
        this.lastToggle = 0;
        this.setupPins();
    }

    setupPins() {
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        this.outputPins[0].setValue(this.state);
    }

    update(timestamp) {
        if (timestamp - this.lastToggle >= this.period / 2) {
            this.state = !this.state;
            this.lastToggle = timestamp;
            this.evaluate();
        }
    }
}

class LED extends Component {
    constructor(x, y) {
        super('LED', x, y, 30, 30);
        this.setupPins();
    }

    setupPins() {
        this.addInputPin(0, this.height / 2);
    }

    evaluate() {
        // LED just displays the input value
    }

    getValue() {
        return this.inputPins[0].getValue();
    }
}
