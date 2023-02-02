class CellNeighbours {
    static directions = ["north", "northEast",
        "east", "southEast",
        "south", "southWest",
        "west", "northWest"];
    north = false;
    northEast = false;
    east = false;
    southEast = false;
    south = false;
    southWest = false;
    west = false;
    northWest = false;
    constructor() { }
    get living() {
        let count = 0;
        for (let direction of CellNeighbours.directions)
            if (this[direction])
                count++;
        return count;
    }
    get dead() {
        let count = 0;
        for (let direction of CellNeighbours.directions)
            if (!this[direction])
                count++;
        return count;
    }
    static directionOffset(direction) {
        switch (direction) {
            case "north":
                return { row: -1, column: 0 };
            case "northEast":
                return { row: -1, column: 1 };
            case "east":
                return { row: 0, column: 1 };
            case "southEast":
                return { row: 1, column: 1 };
            case "south":
                return { row: 1, column: 0 };
            case "southWest":
                return { row: 1, column: -1 };
            case "west":
                return { row: 0, column: -1 };
            case "northWest":
                return { row: -1, column: -1 };
            default:
                throw new Error(`Direction "${direction}" is invalid`);
        }
    }
}
class GameOfLifeModel {
    cells = [];
    iteration = 0;
    get rows() { return this.cells.length; }
    get columns() { return (this.rows > 0) ? this.cells.at(0).length : 0; }
    constructor(rows, columns) {
        if (rows === 0 || columns === 0)
            throw new Error(`Invalid game size: ${rows}x${columns}`);
        while (this.rows < rows)
            this.cells.push(new Array(columns).fill(false));
    }
    copy() {
        let copy = new GameOfLifeModel(this.rows, this.columns);
        for (let i = 0; i < copy.rows; ++i)
            copy.cells[i] = this.cells[i].map((element) => { return element; });
        return copy;
    }
    randomize() {
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.columns; ++j) {
                if (Math.random() < 0.5)
                    this.cells[i][j] = true;
                else
                    this.cells[i][j] = false;
            }
        }
    }
    lifeAt(row, column) {
        this.checkIndexIsValid(row, column);
        return this.cells[row][column];
    }
    reviveCell(row, column) {
        this.checkIndexIsValid(row, column);
        this.cells[row][column] = true;
    }
    killCell(row, column) {
        this.checkIndexIsValid(row, column);
        this.cells[row][column] = false;
    }
    neighbours(row, column) {
        let neighbours = new CellNeighbours();
        for (let direction of CellNeighbours.directions) {
            const offset = CellNeighbours.directionOffset(direction);
            try {
                neighbours[direction] = this.lifeAt(row + offset.row, column + offset.column);
            }
            catch {
                neighbours[direction] = false;
            }
        }
        return neighbours;
    }
    computeChanges() {
        let changes = Array();
        for (let i = 0; i < this.cells.length; ++i) {
            for (let j = 0; j < this.cells.at(i).length; ++j) {
                const neighbours = this.neighbours(i, j);
                if (neighbours.living === 3)
                    changes.push({ row: i,
                        column: j,
                        state: true });
                else if (neighbours.living !== 2)
                    changes.push({ row: i,
                        column: j,
                        state: false });
            }
        }
        return changes;
    }
    applyChanges(changes) {
        for (let change of changes) {
            if (change.state)
                this.reviveCell(change.row, change.column);
            else
                this.killCell(change.row, change.column);
        }
    }
    iterate() {
        this.applyChanges(this.computeChanges());
        this.iteration++;
    }
    addRow() {
        this.cells.push(Array(this.columns).fill(false));
    }
    removeRow() {
        if (this.rows === 1)
            return;
        this.cells.pop();
    }
    addColumn() {
        for (var row of this.cells)
            row.push(false);
    }
    removeColumn() {
        if (this.columns === 1)
            return;
        for (var row of this.cells)
            row.pop();
    }
    checkIndexIsValid(row, column) {
        if (row >= this.rows)
            throw new Error("Row access on model out of range.");
        if (column >= this.columns)
            throw new Error("Column access on model out of range");
    }
    printState() {
        console.log(`Iteration: ${this.iteration}`);
        console.log("----------------------------------------");
        for (let row of this.cells) {
            let rowCells = [];
            for (let cell of row)
                rowCells.push(cell ? "1" : "0");
            console.log(rowCells.join());
            rowCells = [];
        }
        console.log("----------------------------------------");
    }
}
function oscillatorTest() {
    let game = new GameOfLifeModel(25, 25);
    game.reviveCell(11, 11);
    game.reviveCell(11, 12);
    game.reviveCell(11, 13);
    for (let i = 0; i < 10; ++i) {
        game.printState();
        game.iterate();
    }
}
class GameOfLife extends HTMLElement {
    cellSize = 5;
    model = null;
    view = document.createElement("section");
    divs = this.view.querySelectorAll("div");
    constructor() {
        super();
        const DEFAULT_COUNT = 50;
        const rows = this.hasAttribute("rows") ?
            Number(this.getAttribute("rows")) : DEFAULT_COUNT;
        if (isNaN(rows))
            throw new Error("game-of-life: row attribute invalid.");
        const columns = this.hasAttribute("columns") ?
            Number(this.getAttribute("columns")) : DEFAULT_COUNT;
        if (isNaN(columns))
            throw new Error("game-of-life: column attribute invalid.");
        this.model = new GameOfLifeModel(rows, columns);
        this.model.randomize();
        this.attachShadow({ mode: "open" });
        this.view.setAttribute("style", "display: grid; width: 100%; aspect-ratio: 1;");
        this.shadowRoot.append(this.view);
        this.adjustGridLayout();
        this.adjustDivCount();
        this.updateDivColors();
        const INTERVAL = this.hasAttribute("interval") ?
            Number(this.getAttribute("interval")) : 1000;
        if (isNaN(INTERVAL))
            throw new Error("game-of-life: interval attribute invalid.");
        setInterval(() => { this.iterate(); }, INTERVAL);
    }
    adjustGridLayout() {
        this.view.style.gridTemplateRows =
            `repeat(${this.model.rows}, 1fr)`;
        this.view.style.gridTemplateColumns =
            `repeat(${this.model.columns}, 1fr)`;
    }
    adjustDivCount() {
        const MODEL_CELL_COUNT = this.model.rows * this.model.columns;
        while (this.view.childElementCount < MODEL_CELL_COUNT)
            this.view.appendChild(document.createElement("div"));
        this.divs = this.view.querySelectorAll("div");
    }
    updateDivColors() {
        let index = 0;
        for (let i = 0; i < this.model.rows; ++i) {
            for (let j = 0; j < this.model.columns; ++j) {
                if (this.model.lifeAt(i, j))
                    this.divs[index].setAttribute("part", "cell living");
                else
                    this.divs[index].setAttribute("part", "cell deceased");
                index++;
            }
        }
    }
    iterate() {
        this.model.iterate();
        this.updateDivColors();
    }
    divToCoodinates(div) {
        const cells = this.view.getElementsByTagName("div");
        const index = Array.from(cells).indexOf(div);
        return { row: Math.floor(index / this.model.rows),
            column: index % this.model.columns };
    }
}
customElements.define("game-of-life", GameOfLife);
