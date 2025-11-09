// Logic gate implementations
class ANDGate extends Component {
    constructor(x, y, inputs = 2) {
        super('AND', x, y, 60, 40);
        this.numInputs = inputs;
        this.setupPins();
    }

    setupPins() {
        // Add input pins on the left
        const spacing = this.height / (this.numInputs + 1);
        for (let i = 0; i < this.numInputs; i++) {
            this.addInputPin(0, spacing * (i + 1));
        }
        // Add output pin on the right
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        let result = true;
        for (let pin of this.inputPins) {
            result = result && pin.getValue();
        }
        this.outputPins[0].setValue(result);
    }
}

class ORGate extends Component {
    constructor(x, y, inputs = 2) {
        super('OR', x, y, 60, 40);
        this.numInputs = inputs;
        this.setupPins();
    }

    setupPins() {
        const spacing = this.height / (this.numInputs + 1);
        for (let i = 0; i < this.numInputs; i++) {
            this.addInputPin(0, spacing * (i + 1));
        }
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        let result = false;
        for (let pin of this.inputPins) {
            result = result || pin.getValue();
        }
        this.outputPins[0].setValue(result);
    }
}

class NOTGate extends Component {
    constructor(x, y) {
        super('NOT', x, y, 50, 30);
        this.setupPins();
    }

    setupPins() {
        this.addInputPin(0, this.height / 2);
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        const input = this.inputPins[0].getValue();
        this.outputPins[0].setValue(!input);
    }
}

class XORGate extends Component {
    constructor(x, y) {
        super('XOR', x, y, 60, 40);
        this.setupPins();
    }

    setupPins() {
        this.addInputPin(0, this.height / 3);
        this.addInputPin(0, 2 * this.height / 3);
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        const a = this.inputPins[0].getValue();
        const b = this.inputPins[1].getValue();
        this.outputPins[0].setValue(a !== b);
    }
}

class NANDGate extends Component {
    constructor(x, y, inputs = 2) {
        super('NAND', x, y, 60, 40);
        this.numInputs = inputs;
        this.setupPins();
    }

    setupPins() {
        const spacing = this.height / (this.numInputs + 1);
        for (let i = 0; i < this.numInputs; i++) {
            this.addInputPin(0, spacing * (i + 1));
        }
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        let result = true;
        for (let pin of this.inputPins) {
            result = result && pin.getValue();
        }
        this.outputPins[0].setValue(!result);
    }
}

class NORGate extends Component {
    constructor(x, y, inputs = 2) {
        super('NOR', x, y, 60, 40);
        this.numInputs = inputs;
        this.setupPins();
    }

    setupPins() {
        const spacing = this.height / (this.numInputs + 1);
        for (let i = 0; i < this.numInputs; i++) {
            this.addInputPin(0, spacing * (i + 1));
        }
        this.addOutputPin(this.width, this.height / 2);
    }

    evaluate() {
        let result = false;
        for (let pin of this.inputPins) {
            result = result || pin.getValue();
        }
        this.outputPins[0].setValue(!result);
    }
}
