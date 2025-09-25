from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_create_and_get_game():
    r = client.post("/tictactoe/new", json={"starting_player": "O"})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert data["status"] == "playing"

    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    assert data2["board"] == [None] * 9


def test_make_move_and_win_flow():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # X at 0
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    assert r.status_code == 200
    # O at 3
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 3, "player": "O"})
    assert r.status_code == 200
    # X at 1
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 1, "player": "X"})
    assert r.status_code == 200
    # O at 4
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 4, "player": "O"})
    assert r.status_code == 200
    # X at 2 -> win
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 2, "player": "X"})
    assert r.status_code == 200
    data = r.json()
    assert data["winner"] == "X"
    assert data["status"].startswith("X wins")


def test_bad_requests():
    r = client.post("/tictactoe/new", json={})
    gid = r.json()["id"]

    r = client.post(f"/tictactoe/{gid}/move", json={"index": 99, "player": "X"})
    assert r.status_code == 400
    assert "Index must be in range" in r.json()["detail"]

    # occupy 0 then try again
    client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "O"})
    assert r.status_code == 400
    assert "Cell already occupied" in r.json()["detail"]
