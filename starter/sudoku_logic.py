import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def count_solutions(board, limit=2):
    """
    Count number of solutions for `board` using backtracking.
    Stops early and returns as soon as `limit` is reached or exceeded.
    Operates in-place on `board` and relies on callers to pass a deep copy
    if they need the original preserved.
    """
    # find first empty cell
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                total = 0
                for num in range(1, SIZE + 1):
                    if is_safe(board, row, col, num):
                        board[row][col] = num
                        total += count_solutions(board, limit)
                        board[row][col] = EMPTY
                        if total >= limit:
                            return total
                return total
    # no empty cells -> one solution found
    return 1


def remove_cells(board, clues):
    """
    Remove up to (SIZE*SIZE - clues) cells while preserving a unique solution.
    Attempts removals in random order and keeps a removal only if the
    puzzle still has exactly one solution.
    """
    targets = SIZE * SIZE - clues
    positions = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(positions)
    removed = 0

    for (r, c) in positions:
        if removed >= targets:
            break
        if board[r][c] == EMPTY:
            continue
        backup = board[r][c]
        board[r][c] = EMPTY
        # test uniqueness on a deep copy so solver can modify freely
        board_copy = deep_copy(board)
        if count_solutions(board_copy, limit=2) == 1:
            removed += 1
        else:
            board[r][c] = backup

def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
