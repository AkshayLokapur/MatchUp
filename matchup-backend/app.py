# app.py
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Float, Boolean,
    create_engine, Text, UniqueConstraint, func, and_
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, Session
import re
from sqlalchemy import JSON
import razorpay

RAZORPAY_KEY_ID = "rzp_test_SVtaN9SiGN0DOD"
RAZORPAY_KEY_SECRET = "aVmq8Bl4hcXG4WWS13E0AMaA"

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))



# ------------------- CONFIG -------------------
SECRET_KEY = "CHANGE_ME_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

DATABASE_URL = "sqlite:///./matchup.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_owner = OAuth2PasswordBearer(tokenUrl="/owners/auth/login")

app = FastAPI(title="MatchUp API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- MODELS -------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    city = Column(String(100), nullable=True)
    skill_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    games_hosted = relationship("Game", back_populates="host", cascade="all,delete")


class Owner(Base):
    __tablename__ = "owners"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    venue_name = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    venues = relationship("Venue", back_populates="owner", cascade="all,delete")


class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)

    sports_available = Column(JSON, nullable=False)  # ✅ NEW

    city = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    price_per_hour = Column(Float, nullable=False)
    rating = Column(Float, default=4.5)
    image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)
    owner = relationship("Owner", back_populates="venues")

    games = relationship("Game", back_populates="venue", cascade="all,delete")



class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True)
    sport = Column(String(50), nullable=False)
    format = Column(String(50), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    capacity = Column(Integer, nullable=False)
    price_per_player = Column(Float, default=0.0)
    is_public = Column(Boolean, default=True)

    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    venue = relationship("Venue", back_populates="games")
    host = relationship("User", back_populates="games_hosted")
    participants = relationship("GameParticipant", back_populates="game", cascade="all,delete")

    __table_args__ = (
        UniqueConstraint("venue_id", "start_time", name="uq_venue_start"),
    )


class GameParticipant(Base):
    __tablename__ = "game_participants"
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="participants")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    sport = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), index=True)
    game_id = Column(Integer, ForeignKey("games.id"), index=True, nullable=True)
    amount = Column(Float, default=0.0)
    status = Column(String(20), default="confirmed")

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# ------------------- SCHEMAS -------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _bcrypt_safe_text(password: Optional[str]) -> str:
    if not password:
        return ""
    b = password.encode("utf-8")
    if len(b) <= 72:
        return password
    return b[:72].decode("utf-8", errors="ignore")


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6, max_length=256)
    city: Optional[str] = None
    skill_level: Optional[int] = 0

    @field_validator("password")
    @classmethod
    def _password_max_72_bytes(cls, v: str) -> str:
        if len((v or "").encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes in UTF-8")
        return v


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    city: Optional[str]
    skill_level: int

    class Config:
        from_attributes = True


class OwnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    venue_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class OwnerOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    venue_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True

class VenueCreate(BaseModel):
    name: str
    sports_available: List[str]  # ✅ NEW   
    city: str
    address: Optional[str] = None
    price_per_hour: float
    image: Optional[str] = None

    @field_validator("sports_available")
    @classmethod
    def at_least_one_sport(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one sport must be selected")
        return v




class VenueOut(BaseModel):
    id: int
    name: str
    sports_available: List[str]
    city: str
    address: Optional[str]
    price_per_hour: float
    rating: float
    image: Optional[str]

    class Config:
        from_attributes = True



class GameCreate(BaseModel):
    sport: str
    format: Optional[str] = None
    start_time: datetime
    end_time: datetime
    capacity: int
    price_per_player: float = 0.0
    is_public: bool = True
    venue_id: int


class GameOut(BaseModel):
    id: int
    sport: str
    format: Optional[str]
    start_time: datetime
    end_time: datetime
    capacity: int
    price_per_player: float
    is_public: bool
    venue_id: int
    host_id: int

    class Config:
        from_attributes = True


# IMPORTANT: BookingCreate accepts strings (frontend ISO or epoch) for start/end
class BookingCreate(BaseModel):
    venue_id: int
    sport: str
    game_id: Optional[int] = None
    amount: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class BookingRow(BaseModel):
    id: int
    venue_name: str
    sport: Optional[str] = None
    date: str
    time: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------- UTILS / AUTH / HELPERS -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain: str, hashed: str) -> bool:
    safe = _bcrypt_safe_text(plain)
    return pwd_context.verify(safe, hashed)


def get_password_hash(password: str) -> str:
    safe = _bcrypt_safe_text(password)
    return pwd_context.hash(safe)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise exc
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise exc
    return user


def get_current_owner(db: Session = Depends(get_db), token: str = Depends(oauth2_owner)) -> Owner:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate owner credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        owner_id = int(payload.get("sub"))
    except Exception:
        raise exc
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise exc
    return owner


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth = request.headers.get("authorization")
    if not auth:
        return None
    try:
        token = auth.split(" ", 1)[1] if " " in auth else auth
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None


# ------------------- ROBUST TIME PARSER -------------------
def parse_iso_to_utc_naive(s: Optional[object]):
    """
    Parse various incoming time formats to naive UTC datetime:
    - ISO strings (with Z or offsets)
    - 'YYYY-MM-DDTHH:MM' / 'YYYY-MM-DDTHH:MM:SS'
    - epoch seconds or milliseconds (as string or number)
    Returns naive UTC datetime or None.
    """
    if s is None:
        return None

    if isinstance(s, datetime):
        dt = s
        if dt.tzinfo is None:
            local_tz = datetime.now().astimezone().tzinfo
            dt = dt.replace(tzinfo=local_tz)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)

    # numbers or numeric string -> epoch
    try:
        if isinstance(s, (int, float)):
            val = int(s)
            if val > 1_000_000_000_000:
                return datetime.fromtimestamp(val / 1000.0, tz=timezone.utc).replace(tzinfo=None)
            return datetime.fromtimestamp(val, tz=timezone.utc).replace(tzinfo=None)
        if isinstance(s, str) and re.fullmatch(r"\d{10,13}", s.strip()):
            val = int(s.strip())
            if val > 1_000_000_000_000:
                return datetime.fromtimestamp(val / 1000.0, tz=timezone.utc).replace(tzinfo=None)
            return datetime.fromtimestamp(val, tz=timezone.utc).replace(tzinfo=None)
    except Exception:
        pass

    t = s.strip() if isinstance(s, str) else None
    if not t:
        return None

    # handle trailing Z
    if t.endswith("Z"):
        t2 = t[:-1] + "+00:00"
    else:
        t2 = t

    # try ISO parse
    try:
        dt = datetime.fromisoformat(t2)
        if dt.tzinfo is None:
            local_tz = datetime.now().astimezone().tzinfo
            dt = dt.replace(tzinfo=local_tz)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        pass

    # fallback formats
    fmts = [
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
    ]
    for fmt in fmts:
        try:
            dt = datetime.strptime(t, fmt)
            if dt.tzinfo is None:
                local_tz = datetime.now().astimezone().tzinfo
                dt = dt.replace(tzinfo=local_tz)
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            continue

    return None


# ------------------- APP ROUTES -------------------
@app.get("/")
def root():
    return {"service": "MatchUp API", "status": "ok"}


# ---------- Auth ----------
@app.post("/auth/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email = user_in.email.lower().strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, detail="Email already registered as user")

    if db.query(Owner).filter(Owner.email == email).first():
        raise HTTPException(
            400,
            detail="Email already registered as owner. Please login as owner."
        )

    user = User(
        name=user_in.name.strip(),
        email=email,
        hashed_password=get_password_hash(user_in.password),
        city=user_in.city,
        skill_level=user_in.skill_level or 0,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = (form_data.username or "").lower().strip()

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(400, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)

@app.get("/auth/me", response_model=UserOut)
def user_me(current_user: User = Depends(get_current_user)):
    return current_user



# ---------- Owner registration & auth ----------
@app.post("/owners/register", response_model=OwnerOut)
def register_owner(data: OwnerCreate, db: Session = Depends(get_db)):
    email = data.email.lower().strip()

    if db.query(Owner).filter(Owner.email == email).first():
        raise HTTPException(400, detail="Email already registered as owner")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            400,
            detail="Email already registered as user. Please login as user."
        )

    owner = Owner(
        name=data.name.strip(),
        email=email,
        hashed_password=get_password_hash(data.password),
        venue_name=data.venue_name,
        phone=data.phone,
        address=data.address,
    )

    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner



@app.post("/owners/auth/login", response_model=Token)
def owner_login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = (form.username or "").lower().strip()

    owner = db.query(Owner).filter(Owner.email == email).first()
    if not owner or not verify_password(form.password, owner.hashed_password):
        raise HTTPException(400, detail="Incorrect email or password")

    token = create_access_token({"sub": str(owner.id)})
    return Token(access_token=token)




@app.get("/owners/auth/me", response_model=OwnerOut)
def owner_me(owner: Owner = Depends(get_current_owner)):
    return owner


# ---------- Owner: manage venues & bookings ----------
@app.post("/owners/venues", response_model=VenueOut)
def owners_create_venue(venue_in: VenueCreate, owner: Owner = Depends(get_current_owner), db: Session = Depends(get_db)):
    v = Venue(
        name=venue_in.name,
        sports_available=venue_in.sports_available,
        city=venue_in.city,
        address=venue_in.address,
        price_per_hour=venue_in.price_per_hour,
        image=venue_in.image,
        owner_id=owner.id
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.get("/owners/venues", response_model=List[VenueOut])
def owners_list_venues(owner: Owner = Depends(get_current_owner), db: Session = Depends(get_db)):
    return db.query(Venue).filter(Venue.owner_id == owner.id).order_by(Venue.created_at.desc()).all()


@app.get("/owners/venues/{venue_id}", response_model=VenueOut)
def owners_get_venue(venue_id: int, owner: Owner = Depends(get_current_owner), db: Session = Depends(get_db)):
    v = db.query(Venue).get(venue_id)
    if not v or v.owner_id != owner.id:
        raise HTTPException(404, detail="Venue not found")
    return v


@app.put("/owners/venues/{venue_id}", response_model=VenueOut)
def owners_update_venue(
    venue_id: int,
    venue_in: VenueCreate,
    owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    v = db.query(Venue).get(venue_id)
    if not v or v.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Venue not found")
    v.name = venue_in.name
    v.sports_available = venue_in.sports_available
    v.city = venue_in.city
    v.address = venue_in.address
    v.price_per_hour = venue_in.price_per_hour
    v.image = venue_in.image
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.delete("/owners/venues/{venue_id}")
def owners_delete_venue(
    venue_id: int,
    owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    v = db.query(Venue).get(venue_id)
    if not v or v.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Venue not found")
    db.delete(v)
    db.commit()
    return {"status": "deleted"}


@app.get("/owners/venues/{venue_id}/bookings")
def owners_get_venue_bookings(venue_id: int, owner: Owner = Depends(get_current_owner), db: Session = Depends(get_db)):
    v = db.query(Venue).get(venue_id)
    if not v or v.owner_id != owner.id:
        raise HTTPException(404, detail="Venue not found")
    bookings = db.query(Booking).filter(Booking.venue_id == venue_id).order_by(Booking.created_at.desc()).all()

    def _to_datetime(val):
        if val is None:
            return None
        if isinstance(val, datetime):
            return val
        try:
            return datetime.fromisoformat(str(val))
        except Exception:
            try:
                return datetime.strptime(str(val), "%Y-%m-%d %H:%M:%S")
            except Exception:
                return None

    res = []
    for b in bookings:
        user = db.query(User).get(b.user_id)
        g = db.query(Game).get(b.game_id) if b.game_id else None
        start_dt = g.start_time if g else getattr(b, "start_time", None)
        end_dt = g.end_time if g else getattr(b, "end_time", None)
        s_dt = _to_datetime(start_dt)
        e_dt = _to_datetime(end_dt)
        start_iso = s_dt.isoformat() if s_dt else None
        end_iso = e_dt.isoformat() if e_dt else None
        start_disp = s_dt.strftime("%I:%M %p").lstrip("0") if s_dt else (str(start_dt) if start_dt is not None else "")
        end_disp = e_dt.strftime("%I:%M %p").lstrip("0") if e_dt else None
        display_time = f"{start_disp} — {end_disp}" if (start_disp and end_disp) else (start_disp or "")
        res.append({
            "id": b.id,
            "user_email": user.email if user else None,
            "venue_name": v.name,
            "date": s_dt.strftime("%Y-%m-%d") if s_dt else (b.created_at.strftime("%Y-%m-%d") if b.created_at else ""),
            "time": display_time,
            "start_time": start_iso,
            "end_time": end_iso,
            "status": b.status,
            "amount": b.amount
        })
    return res


@app.get("/owners/bookings")
def owners_get_all_bookings(owner: Owner = Depends(get_current_owner), db: Session = Depends(get_db)):
    venue_ids = [v.id for v in db.query(Venue).filter(Venue.owner_id == owner.id).all()]
    if not venue_ids:
        return []
    bookings = db.query(Booking).filter(Booking.venue_id.in_(venue_ids)).order_by(Booking.created_at.desc()).all()

    def _to_datetime(val):
        if val is None:
            return None
        if isinstance(val, datetime):
            return val
        try:
            return datetime.fromisoformat(str(val))
        except Exception:
            try:
                return datetime.strptime(str(val), "%Y-%m-%d %H:%M:%S")
            except Exception:
                return None

    res = []
    for b in bookings:
        v = db.query(Venue).get(b.venue_id)
        user = db.query(User).get(b.user_id)
        g = db.query(Game).get(b.game_id) if b.game_id else None
        start_dt = g.start_time if g else getattr(b, "start_time", None)
        end_dt = g.end_time if g else getattr(b, "end_time", None)
        s_dt = _to_datetime(start_dt)
        e_dt = _to_datetime(end_dt)
        start_iso = s_dt.isoformat() if s_dt else None
        end_iso = e_dt.isoformat() if e_dt else None
        start_disp = s_dt.strftime("%I:%M %p").lstrip("0") if s_dt else (str(start_dt) if start_dt is not None else "")
        end_disp = e_dt.strftime("%I:%M %p").lstrip("0") if e_dt else None
        display_time = f"{start_disp} — {end_disp}" if (start_disp and end_disp) else (start_disp or "")
        res.append({
            "id": b.id,
            "user_email": user.email if user else None,
            "venue_name": v.name if v else None,
            "date": s_dt.strftime("%Y-%m-%d") if s_dt else (b.created_at.strftime("%Y-%m-%d") if b.created_at else ""),
            "time": display_time,
            "start_time": start_iso,
            "end_time": end_iso,
            "status": b.status,
            "amount": b.amount
        })
    return res
@app.get("/venues", response_model=List[VenueOut])
def list_venues(
    sport: Optional[str] = None,
    db: Session = Depends(get_db)
):
    venues = db.query(Venue).all()

    if sport:
        sport = sport.lower()
        venues = [
            v for v in venues
            if sport in [s.lower() for s in v.sports_available]
        ]

    return venues



# ---------- Games (Matches) ----------
@app.post("/games", response_model=GameOut)
def create_game(game_in: GameCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if game_in.end_time <= game_in.start_time:
        raise HTTPException(400, detail="end_time must be after start_time")
    venue = db.query(Venue).get(game_in.venue_id)
    if not venue:
        raise HTTPException(404, detail="Venue not found")
    g = Game(
        sport=game_in.sport,
        format=game_in.format,
        start_time=game_in.start_time,
        end_time=game_in.end_time,
        capacity=game_in.capacity,
        price_per_player=game_in.price_per_player,
        is_public=game_in.is_public,
        venue_id=game_in.venue_id,
        host_id=current_user.id,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    gp = GameParticipant(game_id=g.id, user_id=current_user.id)
    db.add(gp)
    db.commit()
    return g


@app.get("/games", response_model=List[GameOut])
def list_games(sport: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Game)
    if sport:
        q = q.filter(Game.sport.ilike(f"%{sport}%"))
    return q.order_by(Game.start_time.asc()).all()


@app.post("/games/{game_id}/join")
def join_game(game_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = db.query(Game).get(game_id)
    if not game:
        raise HTTPException(404, detail="Game not found")
    count = db.query(GameParticipant).filter(GameParticipant.game_id == game_id).count()
    if count >= game.capacity:
        raise HTTPException(400, detail="Game is full")
    exists = db.query(GameParticipant).filter_by(game_id=game_id, user_id=current_user.id).first()
    if exists:
        raise HTTPException(400, detail="Already joined")
    gp = GameParticipant(game_id=game_id, user_id=current_user.id)
    db.add(gp)
    db.commit()
    return {"status": "joined"}


# ---------- Compatibility endpoints for frontend ----------
@app.get("/users/me/stats")
def user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id
    hosted_count = db.query(func.count(Game.id)).filter(Game.host_id == user_id).scalar() or 0
    joined_count = db.query(func.count(GameParticipant.id)).filter(GameParticipant.user_id == user_id).scalar() or 0
    now = datetime.utcnow()
    hosted_upcoming = db.query(func.count(Game.id)).filter(Game.host_id == user_id, Game.start_time > now).scalar() or 0
    joined_subq = db.query(GameParticipant.game_id).filter(GameParticipant.user_id == user_id).subquery()
    joined_upcoming = db.query(func.count(Game.id)).filter(Game.id.in_(joined_subq), Game.start_time > now).scalar() or 0
    upcoming_count = int(hosted_upcoming + joined_upcoming)
    return {"hosted": int(hosted_count), "joined": int(joined_count), "upcoming": upcoming_count}


@app.get("/matches", response_model=List[GameOut])
def list_matches_compat(
    request: Request,
    scope: Optional[str] = None,
    me: Optional[int] = 0,
    sport: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if scope == "upcoming" and int(me or 0) == 1:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required for me=1 scope")
        now = datetime.utcnow()
        hosted_q = db.query(Game).filter(Game.host_id == current_user.id, Game.start_time > now)
        joined_game_ids = db.query(GameParticipant.game_id).filter(GameParticipant.user_id == current_user.id).subquery()
        joined_q = db.query(Game).filter(Game.id.in_(joined_game_ids), Game.start_time > now)
        hosted = hosted_q.all()
        joined = joined_q.all()
        combined = {g.id: g for g in (hosted + joined)}.values()
        sorted_combined = sorted(combined, key=lambda g: g.start_time)
        return sorted_combined
    params = request.query_params
    status_q = params.get("status")
    upcoming_q = params.get("upcoming")
    if status_q == "upcoming" or (upcoming_q and upcoming_q.lower() in ("1", "true", "yes")) or scope == "upcoming":
        now = datetime.utcnow()
        q = db.query(Game).filter(Game.start_time > now, Game.is_public == True)
        if sport:
            q = q.filter(Game.sport.ilike(f"%{sport}%"))
        return q.order_by(Game.start_time.asc()).all()
    q = db.query(Game)
    if sport:
        q = q.filter(Game.sport.ilike(f"%{sport}%"))
    return q.order_by(Game.start_time.asc()).all()


@app.get("/matches/{match_id}", response_model=GameOut)
def get_match_compat(match_id: int, db: Session = Depends(get_db)):
    g = db.query(Game).get(match_id)
    if not g:
        raise HTTPException(404, detail="Match not found")
    return g


# ---------- Bookings ----------
@app.post("/bookings")
def create_booking(
    b: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a booking. Accepts start_time/end_time as ISO strings or epoch strings.
    Stores naive UTC datetimes in DB.
    Includes slot conflict checking.
    """
    # debug: raw payload
    print("DEBUG: Raw booking payload (incoming):", getattr(b, "__dict__", b))
    # validate venue
    venue = db.query(Venue).get(b.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    # validate game if attached
    if getattr(b, "game_id", None):
        game = db.query(Game).get(b.game_id)
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
    raw_start = getattr(b, "start_time", None)
    raw_end = getattr(b, "end_time", None)
    print("DEBUG: booking raw_start repr:", repr(raw_start))
    print("DEBUG: booking raw_end repr:", repr(raw_end))
    parsed_start = parse_iso_to_utc_naive(raw_start) if raw_start else None
    if raw_start and parsed_start is None:
        raise HTTPException(status_code=400, detail="Invalid start_time format")
    parsed_end = parse_iso_to_utc_naive(raw_end) if raw_end else None
    if raw_end and parsed_end is None:
        raise HTTPException(status_code=400, detail="Invalid end_time format")
    if parsed_start and parsed_end and parsed_end <= parsed_start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")
    # conflict check
    if parsed_start and parsed_end:
        conflict = (
            db.query(Booking)
            .filter(
                Booking.venue_id == int(b.venue_id),
                Booking.status == "confirmed",
                Booking.start_time < parsed_end,
                Booking.end_time > parsed_start
            )
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="This time slot is already booked. Please choose another time.")
    amount_val = float(b.amount or 0.0)
    booking = Booking(
        user_id=current_user.id,
        venue_id=int(b.venue_id),
        game_id=(int(b.game_id) if getattr(b, "game_id", None) else None),
        sport=b.sport,
        amount=amount_val,
        status="pending",
        start_time=parsed_start,
        end_time=parsed_end,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    print("DEBUG: created booking id:", booking.id, "start_time:", booking.start_time, "end_time:", booking.end_time)
    return {"id": booking.id, "status": booking.status}


# NEW: GET /bookings (user) - returns user's bookings (used by frontend)
@app.get("/bookings", response_model=List[BookingRow])
def my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows: List[BookingRow] = []
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()

    for b in bookings:
        v = db.query(Venue).get(b.venue_id)
        venue_name = v.name if v else f"Venue {b.venue_id}"
        sport = b.sport
        start_dt = b.start_time
        end_dt = b.end_time
        if getattr(b, "game_id", None):
            g = db.query(Game).get(b.game_id)
            if g:
                sport = g.sport
                start_dt = g.start_time
                end_dt = g.end_time
        if not start_dt:
            start_dt = getattr(b, "start_time", None)
        if not end_dt:
            end_dt = getattr(b, "end_time", None)
        if not start_dt:
            start_dt = b.created_at

        def _to_datetime(val):
            if val is None:
                return None
            if isinstance(val, datetime):
                return val
            try:
                return datetime.fromisoformat(str(val))
            except Exception:
                try:
                    return datetime.strptime(str(val), "%Y-%m-%d %H:%M:%S")
                except Exception:
                    return None

        s_dt = _to_datetime(start_dt)
        e_dt = _to_datetime(end_dt)

        date_str = s_dt.strftime("%Y-%m-%d") if s_dt else (b.created_at.strftime("%Y-%m-%d") if b.created_at else "")
        start_iso = s_dt.isoformat() if s_dt else None
        end_iso = e_dt.isoformat() if e_dt else None
        start_disp = s_dt.strftime("%I:%M %p").lstrip("0") if s_dt else (str(start_dt) if start_dt is not None else "")
        end_disp = e_dt.strftime("%I:%M %p").lstrip("0") if e_dt else None
        if start_disp and end_disp:
            display_time = f"{start_disp} — {end_disp}"
        elif start_disp:
            display_time = f"{start_disp}"
        else:
            display_time = ""

        rows.append(BookingRow(
            id=b.id,
            venue_name=venue_name,
            sport=sport,
            date=date_str,
            time=display_time,
            start_time=start_iso,
            end_time=end_iso,
            status=getattr(b, "status", None),
        ))

    return rows
@app.post("/create-order")
def create_order(data: dict):
    amount = int(data.get("amount", 0))

    if amount <= 0:
        raise HTTPException(400, detail="Invalid amount")

    order = razorpay_client.order.create({
        "amount": amount * 100,
        "currency": "INR",
        "payment_capture": 1
    })

    return order

@app.post("/verify-payment")
def verify_payment(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("VERIFY PAYMENT CALLED:", data)
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        })

        booking = Booking(
            user_id=current_user.id,
            venue_id=data['venue_id'],
            sport=data['sport'],
            amount=data['amount'],
            status="confirmed",
            start_time=parse_iso_to_utc_naive(data.get("start_time")),
            end_time=parse_iso_to_utc_naive(data.get("end_time")),
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {"status": "success"}

    except Exception:
        raise HTTPException(status_code=400, detail="Payment failed")




Base.metadata.create_all(bind=engine)
