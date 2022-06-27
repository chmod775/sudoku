const fs = require('fs');

class Cell {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.isOriginal = false;

		this.numbers = [];
		for (var i = 0; i < 9; i++)
			this.numbers.push(true);
	}

	setOriginal() {
		this.isOriginal = true;
	}

	setUnique(number) {
		for (var i = 0; i < 9; i++)
			this.numbers[i] = ((i + 1) == number);
	}

	clearNumber(number) {
		let alreadyClear = this.numbers[number - 1] == false;
		this.numbers[number - 1] = false;
		return !alreadyClear;
	}

	containsNumber(number) {
		return this.numbers[number - 1];
	}

	count() {
		let cnt = 0;
		for (var i = 0; i < 9; i++)
			if (this.numbers[i])
				cnt++;
		return cnt;
	}

	isUnique() {
		return this.count() == 1;
	}
	
	getNumbers() {
		let ret = [];
		for (var i = 0; i < 9; i++)
			if (this.numbers[i])
				ret.push(i + 1);
		return ret;
	}

	toString() {
		if (!this.isUnique()) return '0';

		let RED="\x1b[31m";
		let ENDCOLOR="\x1b[0m"

		if (!this.isOriginal)
			return RED + this.getNumbers()[0] + ENDCOLOR;
		return this.getNumbers()[0];
	}
}

class Table {
	constructor(filename) {
		this.cells = [];

		for (var y = 0; y < 9; y++) {
			let row = [];
			for (var x = 0; x < 9; x++) {
				row.push(new Cell(x, y));
			}
			this.cells.push(row);
		}
	}

	static SquareAddress = [
		{ x: 0, y: 0 },
		{ x: 3, y: 0 },
		{ x: 6, y: 0 },
		{ x: 0, y: 3 },
		{ x: 3, y: 3 },
		{ x: 6, y: 3 },
		{ x: 0, y: 6 },
		{ x: 3, y: 6 },
		{ x: 6, y: 6 }
	];

	static GetSquareFromCoords(x, y) {
		for (var i = 0; i < 9; i++) {
			let addr = Table.SquareAddress[i];
			if ((x >= addr.x) && (x < addr.x + 3))
				if ((y >= addr.y) && (y < addr.y + 3))
					return i;
		}
	}

	static FromFile(filename) {
		let ret = new Table();
		ret.content = fs.readFileSync(filename, 'utf8');

		let rows = ret.content.split('\n');
		if (rows.length != 9) throw `File ${filename} not valid.`;

		for (var y = 0; y < 9; y++) {
			let row = rows[y];
			if (row.length != 9) throw `File ${filename} not valid.`;

			for (var x = 0; x < 9; x++) {
				let cell = +row[x];
				if (cell > 0) {
					ret.setCellUnique(x, y, cell);
					ret.cells[y][x].setOriginal();
				}
			}
		}

		return ret;
	}

	setCellUnique(x, y, number) {
		this.cells[y][x].setUnique(number);
	}

	toString() {
		let out = '';
		for (var y = 0; y < 9; y++) {
			let row = '';
			for (var x = 0; x < 9; x++) {
				row += this.cells[y][x];
			}
			out += row + '\n';
		}
		return out;
	}

	getRowCells(row) {
		let ret = [];
		for (var i = 0; i < 9; i++) {
			ret.push(this.cells[row][i]);
		}
		return ret;
	}

	getColCells(col) {
		let ret = [];
		for (var i = 0; i < 9; i++) {
			ret.push(this.cells[i][col]);
		}
		return ret;
	}

	getSquareCells(square) {
		let ret = [];
		let addr = Table.SquareAddress[square];

		for (var y = addr.y; y < addr.y + 3; y++) {
			for (var x = addr.x; x < addr.x + 3; x++) {
				ret.push(this.cells[y][x]);
			}
		}

		return ret;
	}

	getUniqueCells() {
		let ret = [];

		for (var y = 0; y < 9; y++) {
			for (var x = 0; x < 9; x++) {
				let c = this.cells[y][x];
				if (c.isUnique())
					ret.push(c);
			}
		}

		return ret;
	}

	stepEasy() {
		let changed = false;
		let uniques = this.getUniqueCells();

		for (var u of uniques) {
			let cellContent = u.getNumbers()[0];
			let rowCells = this.getRowCells(u.y);
			let colCells = this.getColCells(u.x);
			let sqCells = this.getSquareCells(Table.GetSquareFromCoords(u.x, u.y));

			for (var c of rowCells)
				if ((c.x != u.x) || (c.y != u.y))
					changed |= c.clearNumber(cellContent);
			for (var c of colCells)
				if ((c.x != u.x) || (c.y != u.y))
					changed |= c.clearNumber(cellContent);
			for (var c of sqCells)
				if ((c.x != u.x) || (c.y != u.y))
					changed |= c.clearNumber(cellContent);
		}

		return changed;
	}

}

const easyTable = Table.FromFile('easy.sud');
while (easyTable.stepEasy());

console.log(easyTable.getUniqueCells());
console.log(easyTable.toString());

