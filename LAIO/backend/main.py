from fastapi import FastAPI

app = FastAPI(title="LAIO API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Chào mừng đến với API Luyện Từ All-In-One (LAIO)!"}