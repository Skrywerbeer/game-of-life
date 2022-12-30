interface DirectionOffset {
	row: number;
	column: number;
}

interface CellCoordinates {
	row: number;
	column: number;
}

class CellNeighbours {
	static directions: Array<string> = ["north", "northEast",
										"east", "southEast",
										"south", "southWest",
										"west", "northWest"];
	north: boolean = false;
	northEast: boolean = false;
	east: boolean = false;
	southEast: boolean = false;
	south: boolean = false;
	southWest: boolean = false;
	west: boolean = false;
	northWest: boolean = false;

	constructor() {}

	get living(): number {
		let count = 0;
		for (let direction of CellNeighbours.directions)
			if (this[direction])
				count++;
		return count;
	}
	get dead(): number {
		let count = 0;
		for (let direction of CellNeighbours.directions)
			if (!this[direction])
				count++;
		return count;
	}
	static directionOffset(direction: string): DirectionOffset {
		switch(direction) {
			case "north":
				return {row: -1, column: 0};
			case "northEast":
				return {row: -1, column: 1};
			case "east":
				return {row: 0, column: 1};
			case "southEast":
				return {row: 1, column: 1};
			case "south":
				return {row: 1, column: 0};
			case "southWest":
				return {row: 1, column: -1};
			case "west":
				return {row: 0, column: -1};
			case "northWest":
				return {row: -1, column: -1};
			default:
				throw new Error(`Direction "${direction}" is invalid`);
		}
	}
}

class GameOfLifeModel {
	cells: Array<Array<boolean>> = [];
	iteration: number = 0;
	get rows(): number {return this.cells.length}
	get columns(): number {return (this.rows > 0) ? this.cells.at(0).length : 0}

	constructor(rows: number, columns: number) {
		if (rows === 0 || columns === 0)
			throw new Error(`Invalid game size: ${rows}x${columns}`);
		while (this.rows < rows)
			this.cells.push(new Array(columns).fill(false));
	}
	copy(): GameOfLifeModel {
		let copy = new GameOfLifeModel(this.rows, this.columns);
		for (let i = 0; i < copy.rows; ++i)
			copy.cells[i] = this.cells[i].map((element) => {return element});
		return copy;
	}
	randomize(): void {
		for (let i = 0; i < this.rows; ++i) { 
			for (let j = 0; j < this.columns; ++j) {
				if (Math.random() < 0.5)
					this.cells[i][j] = true;
				else
					this.cells[i][j] = false;
			}
		}
	}
	lifeAt(row: number, column: number): boolean {
		this.checkIndexIsValid(row, column);
		return this.cells[row][column];
	}
	reviveCell(row: number, column: number): void {
		this.checkIndexIsValid(row, column);
		this.cells[row][column] = true;
	}
	killCell(row: number, column: number): void {
		this.checkIndexIsValid(row, column);
		this.cells[row][column] = false;
	}
	neighbours(row: number, column: number): CellNeighbours {
		let neighbours = new CellNeighbours();
		for (let direction of CellNeighbours.directions) {
			const offset = CellNeighbours.directionOffset(direction);
			// if row or column is at the edge
			// this.lifeAt will through an exception.
			try {
				neighbours[direction] = this.lifeAt(row + offset.row,
													column + offset.column);
			}
			// catch. And pretend the neighbour is dead.
			catch {
				neighbours[direction] = false;
			}
		}
		return neighbours;
	}
	iterate(): void {
		let copy = this.copy();
		for (let i = 0; i < copy.rows; ++i) {
			for (let j = 0; j < copy.columns; ++j) {
				const neighbours = this.neighbours(i, j);
				if (neighbours.living === 3)
					copy.reviveCell(i, j);
				else if (neighbours.living !== 2)
					copy.killCell(i, j);
			}
		}
		this.cells = copy.cells;
		this.iteration++;
	}
	// Adds a row to the end.
	addRow(): void {
		this.cells.push(Array<boolean>(this.columns).fill(false));
	}
	// Removes the last row.
	removeRow(): void {
		if (this.rows === 1)
			return;
		this.cells.pop();
	}
	// Adds a column to the end.
	addColumn(): void {
		for (var row of this.cells)
			row.push(false);
	}
	// Removes the last column.
	removeColumn(): void {
		if (this.columns === 1)
			return;
		for (var row of this.cells)
			row.pop();
	}
	checkIndexIsValid(row: number, column: number): void {
		if (row >= this.rows)
			throw new Error("Row access on model out of range.");
		if (column >= this.columns)
			throw new Error("Column access on model out of range");
	}
	printState(): void {
		console.log(`Iteration: ${this.iteration}`);
		console.log("----------------------------------------")
		for (let row of this.cells) {
			let rowCells = [];
			for (let cell of row)
				rowCells.push(cell ? "1" : "0");
			console.log(rowCells.join());
			rowCells = [];
		}
		console.log("----------------------------------------")
	}
	
}

function oscillatorTest() {
	// Tests
	let game = new GameOfLifeModel(25, 25);
	game.reviveCell(11, 11);
	game.reviveCell(11, 12);
	game.reviveCell(11, 13)

	for (let i = 0; i < 10; ++i) {
		game.printState();
		game.iterate();
	}
}

class GameView {
	cellSize: number = 5;
	model: GameOfLifeModel = new GameOfLifeModel(100, 100);
	view: HTMLElement = document.getElementById("gameView") !;
	divs: NodeListOf<Element> = document.querySelectorAll("#gameView div");

	constructor() {
		this.adjustGridLayout();
		this.adjustDivCount();
		this.updateDivColors();
	}

	adjustGridLayout(): void {
		this.view.style.gridTemplateRows =
			//`repeat(${this.model.rows}, ${this.cellSize}px)`;
			`repeat(${this.model.rows}, 1fr)`;
		this.view.style.gridTemplateColumns =
			//`repeat(${this.model.columns}, ${this.cellSize}px)`;
			`repeat(${this.model.columns}, 1fr)`;
	}
	adjustDivCount(): void {
		const MODEL_CELL_COUNT = this.model.rows*this.model.columns;
		while (this.view.childElementCount > MODEL_CELL_COUNT)
			this.view.removeChild(this.view.lastElementChild);
		while (this.view.childElementCount < MODEL_CELL_COUNT) {
			let div = document.createElement("div");
			div.className = "gameCell";
			this.view.appendChild(div);
		}
	}
	updateDivColors(): void {
		let index = 0;
		const divs = document.querySelectorAll("#gameView div");
		for (let i = 0; i < this.model.rows; ++i) {
			for (let j = 0; j < this.model.columns; ++j) {
				if (this.model.lifeAt(i, j))
					divs[index].className = "alive";
				else
					divs[index].className = "dead";
				index++;
			}
		}
	}
	iterate(): void {
		this.model.iterate();
		this.updateDivColors();
	}
	divToCoodinates(div: HTMLDivElement): CellCoordinates {
		const cells = this.view.getElementsByTagName("div");
		const index = Array.from(cells).indexOf(div);
		return {row: Math.floor(index/this.model.rows),
				column: index % this.model.columns};
	}
}

let game = new GameView();

//game.model.reviveCell(4, 4);
//game.model.reviveCell(4, 5);
//game.model.reviveCell(4, 6);
game.model.randomize();
game.updateDivColors();

game.view.addEventListener("click", (event) => {
	if (event.target === game.view)
		return;
	console.log(game.divToCoodinates(event.target as HTMLDivElement));
});

setInterval(() => {
	game.iterate();
}, 500);
