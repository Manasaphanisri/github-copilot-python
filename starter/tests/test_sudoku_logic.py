import importlib.util
from pathlib import Path

# Attempt normal import, fallback to locating sudoku_logic.py by path
try:
    import sudoku_logic as sl
except Exception:
    here = Path(__file__).resolve()
    repo_root = here.parents[2]  # ...\starter\tests\ -> go up to starter
    mod_path = None
    candidates = [
        repo_root / "sudoku_logic.py",
        repo_root / "src" / "sudoku_logic.py",
        repo_root.parent / "sudoku_logic.py",
    ]
    for c in candidates:
        if c.exists():
            mod_path = c
            break
    if mod_path is None:
        for p in repo_root.rglob("sudoku_logic.py"):
            mod_path = p
            break
    if mod_path is None:
        raise ImportError("Could not locate sudoku_logic.py")
    spec = importlib.util.spec_from_file_location("sudoku_logic", str(mod_path))
    sl = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sl)

def is_9x9(grid):
    return (
        isinstance(grid, (list, tuple))
        and len(grid) == 9
        and all(isinstance(row, (list, tuple)) and len(row) == 9 for row in grid)
    )

def is_valid_solution(grid):
    if not is_9x9(grid):
        return False
    required = set(range(1, 10))
    # rows
    for row in grid:
        if set(row) != required:
            return False
    # columns
    for c in range(9):
        if set(grid[r][c] for r in range(9)) != required:
            return False
    # 3x3 boxes
    for br in range(3):
        for bc in range(3):
            cells = [
                grid[r][c]
                for r in range(br * 3, br * 3 + 3)
                for c in range(bc * 3, bc * 3 + 3)
            ]
            if set(cells) != required:
                return False
    return True

def test_generate_puzzle_returns_valid_puzzle_and_solution():
    result = sl.generate_puzzle()
    assert isinstance(result, tuple) and len(result) == 2
    puzzle, solution = result

    assert is_9x9(puzzle), "Puzzle must be a 9x9 grid"
    assert is_9x9(solution), "Solution must be a 9x9 grid"
    assert puzzle != solution, "Puzzle should not be identical to the solution"

    # Puzzle entries must be ints 0..9, solution entries 1..9, and non-zero puzzle cells must match solution
    for r in range(9):
        for c in range(9):
            p = puzzle[r][c]
            s = solution[r][c]
            assert isinstance(s, int) and 1 <= s <= 9
            assert isinstance(p, int) and 0 <= p <= 9
            if p != 0:
                assert p == s

    assert is_valid_solution(solution)