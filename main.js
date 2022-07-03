const fs = require('fs');
const { nextTick } = require('process');

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

	clearNumbers(numbers) {
		let changed = false;
		for (var n of numbers)
			changed |= this.clearNumber(n);
		return changed;
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

	isEqual(cell) {
		let mineNumbers = this.getNumbers();
		let themNumbers = cell.getNumbers();
		if (mineNumbers.length != themNumbers.length) return false;

		for (var n of mineNumbers)
			if (!themNumbers.includes(n))
				return false;
		
		return true;
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

		if (changed) this.print();
		return changed;
	}

	stepMedium() {
		let changed = false;

		for (var i = 0; i < 9; i++) {
			let rowCells = this.getRowCells(i);
			let colCells = this.getColCells(i);
			let sqCells = this.getSquareCells(i);

			let rowNumbers = Table.FilterSingleNonUniqueOccurrence(Table.CountNumberOccurrences(rowCells));
			let colNumbers = Table.FilterSingleNonUniqueOccurrence(Table.CountNumberOccurrences(colCells));
			let sqNumbers = Table.FilterSingleNonUniqueOccurrence(Table.CountNumberOccurrences(sqCells));

			for (var o of rowNumbers) { o.cell.setUnique(o.num); changed = true; }
			for (var o of colNumbers) { o.cell.setUnique(o.num); changed = true; }
			for (var o of sqNumbers) { o.cell.setUnique(o.num); changed = true; }
		}

		if (changed) this.print();
		return changed;
	}

	stepHard() {
		let changed = false;

		for (var i = 0; i < 9; i++) {
			let rowCells = this.getRowCells(i);
			let colCells = this.getColCells(i);
			let sqCells = this.getSquareCells(i);
		
			let rowTwins = Table.FindHiddenTwins(rowCells);
			let colTwins = Table.FindHiddenTwins(colCells);
			let sqTwins = Table.FindHiddenTwins(sqCells);

			for (var t of rowTwins) {
				for (var c of rowCells) {
					if (t.filter(tw => tw.isEqual(c)).length > 0) continue;
					changed |= c.clearNumbers(t[0].getNumbers());
				}
			}

			for (var t of colTwins) {
				for (var c of colCells) {
					if (t.filter(tw => tw.isEqual(c)).length > 0) continue;
					changed |= c.clearNumbers(t[0].getNumbers());
				}
			}

			for (var t of sqTwins) {
				for (var c of sqCells) {
					if (t.filter(tw => tw.isEqual(c)).length > 0) continue;
					changed |= c.clearNumbers(t[0].getNumbers());
				}
			}

		}

		if (changed) this.print();
		return changed;
	}

	stepExpert() {
		let changed = false;

		for (var i = 0; i < 9; i++) {
			let rowCells = this.getRowCells(i);
			let colCells = this.getColCells(i);
		
			let rowTwins = Table.FindHiddenTwins(rowCells);
			let colTwins = Table.FindHiddenTwins(colCells);

			

		}

		if (changed) this.print();
		return changed;
	}



	static FindTwinCellsInSequence(cell, seq) {
		let ret = [];

		for (var c of seq)
			if (!c.isUnique())
				if ((c.x != cell.x) || (c.y != cell.y))
					if (c.isEqual(cell))
						ret.push(c);

		return ret;
	}

	static FindHiddenTwins(seq) {
		let ret = [];
		let foundTwins = [];

		for (var c of seq) {
			if (c.isUnique()) continue;
			if (foundTwins.filter(t => t.isEqual(c)).length > 0) continue;

			let cellNumbers = c.getNumbers();
			let twins = Table.FindTwinCellsInSequence(c, seq);

			if (twins.length == (cellNumbers.length - 1)) {
				foundTwins.push(c);
				foundTwins.push(...twins);

				twins.push(c);
				ret.push(twins);
			}
		}

		return ret;
	}

	static FilterSingleNonUniqueOccurrence(occ) {
		let ret = [];
		for (var i = 0; i < 9; i++) {
			let o = occ[i];
			if (o.length == 1) {
				let c = o[0];
				if (!c.isUnique())
					ret.push({ num: i + 1, cell: c });
			}
		}

		return ret;
	}

	static CountNumberOccurrences(seq) {
		let numbers = [ [], [], [], [], [], [], [], [], [] ];

		for (var c of seq) {
			let cellNumbers = c.getNumbers();
			for (var n of cellNumbers)
				numbers[n - 1].push(c);
		}

		return numbers;
	}

	static ValidateSequence(seq) {
		if (seq.length != 9) throw `Sequence not valid.`;
		let numbers = [];
		for (var c of seq) {
			if (!c.isUnique()) throw `Solution not valid: Cell [${c.y + 1}, ${c.x + 1}] is not unique. Contains numbers ${c.getNumbers().join(',')}`;

			let cellContent = c.getNumbers()[0];
			if (numbers.includes(cellContent)) throw `Solution not valid: Cell [${c.y + 1}, ${c.x + 1}] value duplicated (${cellContent}).`;
			numbers.push(cellContent);
		}
	}

	validateSolution() {
		for (var i = 0; i < 9; i++) {
			let rowCells = this.getRowCells(i);
			let colCells = this.getColCells(i);
			let sqCells = this.getSquareCells(i);

			Table.ValidateSequence(rowCells);
			Table.ValidateSequence(colCells);
			Table.ValidateSequence(sqCells);
		}
		console.log('Sudoku validated successfully!');
	}

	printNumbers() {
		for (var y = 0; y < 9; y++) {
			for (var x = 0; x < 9; x++) {
				let c = this.cells[y][x];
				if (!c.isUnique()) {
					console.log(`[${c.y + 1}, ${c.x + 1}]: ${c.getNumbers().join(',')}`);
				}
			}
		}
	}

	print() {
		console.log(this.toString());
	}
}

const easyTable = Table.FromFile('expert.sud');
global.table = easyTable;


const repl = require("repl");

do {
	do {
		while (easyTable.stepEasy());
	} while (easyTable.stepMedium());
} while (easyTable.stepHard());
repl.start("custom-repl => ");

//easyTable.validateSolution();

//console.log(easyTable.getUniqueCells());
console.log(easyTable.toString());

