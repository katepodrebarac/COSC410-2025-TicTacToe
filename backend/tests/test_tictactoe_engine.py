import pytest

from app.tictactoe.engine import available_moves, move, new_game


def test_new_game_initial_state():
    # PASSED
    gs = new_game()
    assert gs.board == [None] * 9
    # assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    # assert status(gs) == "X's turn"


def test_valid_move():
    gs = new_game()
    gs = move(gs, 0, "X")
    assert gs.board[0] == "X"
    # assert gs.current_player == "O"
    assert gs.winner is None
    assert not gs.is_draw


def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "O")


def test_winning_rows():
    # Row win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 3, "O")  # O
    gs = move(gs, 1, "X")  # X
    gs = move(gs, 4, "O")  # O
    gs = move(gs, 2, "X")  # X wins
    assert gs.winner == "X"


def test_winning_cols():
    # Column win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 1, "O")  # O
    gs = move(gs, 3, "X")  # X
    gs = move(gs, 2, "O")  # O
    gs = move(gs, 6, "X")  # X wins
    assert gs.winner == "X"


def test_winning_diagonals():
    # Diagonal win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 1, "O")  # O
    gs = move(gs, 4, "X")  # X
    gs = move(gs, 2, "O")  # O
    gs = move(gs, 8, "X")  # X wins
    assert gs.winner == "X"


def test_draw_condition():
    gs = new_game()
    # X O X
    # X X O
    # O X O
    # sequence crafted to avoid earlier wins
    seq = [(0, "X"), (1, "O"), (2, "X"), (5, "O"), (3, "X"), (6, "O"), (4, "X"), (8, "O"), (7, "X")]
    for pos, player in seq:
        gs = move(gs, pos, player)
    assert gs.is_draw is True
    assert gs.winner is None


def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4, "X")
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8


def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 3, "O")  # O
    gs = move(gs, 1, "X")  # X
    gs = move(gs, 4, "O")  # O
    gs = move(gs, 2, "X")  # X wins
    with pytest.raises(ValueError):
        move(gs, 8, "O")
