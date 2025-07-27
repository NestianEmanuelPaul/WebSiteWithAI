from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Body, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, JSON, Text, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, Field, Json
from typing import List, Optional, Dict, Any, Union
import os
import json

# Initialize FastAPI app
app = FastAPI(title="AI-Powered Visual Development Platform",
             description="Backend for the visual development platform",
             version="0.1.0")

app = FastAPI(
    title="AI-Powered Visual Development Platform",
    description="Backend for the visual development platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None
)

# Test endpoint to verify CORS is working
@app.get("/api/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

# CORS middleware - must be added before any other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./visual_platform.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, default="Default Project")
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    elements = relationship("CanvasElement", back_populates="project")

class CanvasElement(Base):
    __tablename__ = "canvas_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), default=1)
    element_id = Column(String, index=True)  # Frontend-generated ID
    element_type = Column(String, index=True)  # 'button', 'checkbox', etc.
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="elements")
    properties = relationship("ElementProperty", back_populates="element", cascade="all, delete-orphan")

class ElementProperty(Base):
    __tablename__ = "element_properties"
    
    id = Column(Integer, primary_key=True, index=True)
    element_id = Column(Integer, ForeignKey("canvas_elements.id"))
    key = Column(String, index=True)  # e.g., 'text', 'style', 'checked'
    value = Column(Text)  # Store as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    element = relationship("CanvasElement", back_populates="properties")

# Pydantic models
class ElementPropertyBase(BaseModel):
    key: str
    value: str

class ElementPropertyCreate(ElementPropertyBase):
    pass

class ElementPropertyResponse(ElementPropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CanvasElementBase(BaseModel):
    element_id: str
    element_type: str
    x: int
    y: int
    properties: Dict[str, Any] = {}

class CanvasElementCreate(CanvasElementBase):
    pass

class CanvasElementResponse(CanvasElementBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Database schema inspection
@app.get("/api/db/schema", response_model=Dict[str, Any])
async def get_db_schema(db: Session = Depends(get_db)):
    """Get the complete database schema including tables and columns"""
    inspector = inspect(engine)
    schema = {}
    
    for table_name in inspector.get_table_names():
        columns = []
        for column in inspector.get_columns(table_name):
            columns.append({
                "name": column["name"],
                "type": str(column["type"]),
                "nullable": column["nullable"],
                "default": str(column["default"]) if column["default"] is not None else None,
                "primary_key": column.get("primary_key", False)
            })
        
        # Get foreign key relationships
        foreign_keys = []
        for fk in inspector.get_foreign_keys(table_name):
            foreign_keys.append({
                "constrained_columns": fk["constrained_columns"],
                "referred_table": fk["referred_table"],
                "referred_columns": fk["referred_columns"]
            })
        
        schema[table_name] = {
            "columns": columns,
            "foreign_keys": foreign_keys
        }
    
    return schema

# Table operations
class ForeignKeyReference(BaseModel):
    table: str
    column: str

class ColumnCreate(BaseModel):
    name: str
    type: str
    nullable: bool = True
    default: Optional[str] = None
    primary_key: bool = False
    foreign_key: Optional[ForeignKeyReference] = None

class TableCreate(BaseModel):
    name: str
    columns: List[ColumnCreate]

@app.post("/api/db/tables/", status_code=201)
async def create_table(table: TableCreate, db: Session = Depends(get_db)):
    """Create a new table in the database"""
    try:
        # Start a transaction
        connection = engine.connect()
        trans = connection.begin()
        
        try:
            # Generate the CREATE TABLE SQL
            columns_sql = []
            fk_constraints = []
            
            for idx, col in enumerate(table.columns):
                col_def = f'"{col.name}" {col.type}'
                if not col.nullable:
                    col_def += ' NOT NULL'
                if col.default is not None:
                    col_def += f' DEFAULT {col.default}'
                if col.primary_key:
                    col_def += ' PRIMARY KEY'
                columns_sql.append(col_def)
                
                # Add foreign key constraint if specified
                if col.foreign_key:
                    fk_name = f"fk_{table.name}_{col.name}_{idx}"
                    fk_sql = f'CONSTRAINT "{fk_name}" FOREIGN KEY ("{col.name}") '
                    fk_sql += f'REFERENCES "{col.foreign_key.table}" ("{col.foreign_key.column}")'
                    fk_constraints.append(fk_sql)
            
            # Combine all SQL parts
            all_constraints = columns_sql + fk_constraints
            create_table_sql = f'CREATE TABLE "{table.name}" (\n  ' + ',\n  '.join(all_constraints) + '\n)'
            
            # Execute the SQL
            connection.execute(text(create_table_sql))
            
            # Commit the transaction
            trans.commit()
            
            # Return the created table schema
            inspector = inspect(engine)
            columns = []
            for column in inspector.get_columns(table.name):
                columns.append({
                    "name": column["name"],
                    "type": str(column["type"]),
                    "nullable": column["nullable"],
                    "default": str(column["default"]) if column["default"] is not None else None,
                    "primary_key": column.get("primary_key", False)
                })
            
            return {
                "name": table.name,
                "columns": columns,
                "foreign_keys": []
            }
            
        except Exception as e:
            trans.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to create table: {str(e)}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        connection.close()

class TableUpdate(TableCreate):
    # Same as TableCreate but name is optional for updates
    name: Optional[str] = None

@app.put("/api/db/tables/{table_name}")
async def update_table(
    table_name: str,
    table_update: TableUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing table's schema"""
    try:
        # Start a transaction
        connection = engine.connect()
        trans = connection.begin()
        
        try:
            inspector = inspect(engine)
            
            # Check if table exists
            if table_name not in inspector.get_table_names():
                raise HTTPException(status_code=404, detail=f"Table {table_name} not found")
            
            # Get existing columns and primary key
            existing_columns = {col["name"]: col for col in inspector.get_columns(table_name)}
            pk_columns = [col["name"] for col in existing_columns.values() if col.get("primary_key", False)]
            
            # Get existing foreign keys
            existing_fks = {}
            for fk in inspector.get_foreign_keys(table_name):
                for col in fk["constrained_columns"]:
                    existing_fks[col] = fk
            
            # Create a temporary table name
            temp_table_name = f"{table_name}_temp_{int(datetime.utcnow().timestamp())}"
            
            # Build the new table definition
            column_defs = []
            fk_constraints = []
            
            # Process each column in the update
            for col in table_update.columns:
                # Build column definition
                col_def = f'"{col.name}" {col.type}'
                if not col.nullable:
                    col_def += ' NOT NULL'
                if col.default is not None and col.default != '':
                    col_def += f' DEFAULT {col.default}'
                if col.primary_key:
                    col_def += ' PRIMARY KEY'
                
                column_defs.append(col_def)
                
                # Add foreign key constraint if needed
                if col.foreign_key:
                    fk_name = f"fk_{temp_table_name}_{col.name}"
                    fk_sql = f'FOREIGN KEY ("{col.name}") REFERENCES "{col.foreign_key.table}" ("{col.foreign_key.column}")'
                    fk_constraints.append(fk_sql)
            
            # Create the new table with all constraints
            create_table_sql = f'CREATE TABLE "{temp_table_name}" (\n  ' + ',\n  '.join(column_defs + fk_constraints) + '\n)'
            connection.execute(text(create_table_sql))
            
            # Copy data from old table to new table
            if table_update.columns:
                # Get common columns between old and new schema
                common_columns = [f'"{col.name}"' for col in table_update.columns 
                                if col.name in existing_columns]
                
                if common_columns:
                    columns_str = ', '.join(common_columns)
                    copy_sql = f'INSERT INTO "{temp_table_name}" ({columns_str}) SELECT {columns_str} FROM "{table_name}"'
                    connection.execute(text(copy_sql))
            
            # Drop the old table
            connection.execute(text(f'DROP TABLE "{table_name}"'))
            
            # Rename the new table to the original name
            connection.execute(text(f'ALTER TABLE "{temp_table_name}" RENAME TO "{table_name}"'))
            
            # Update table name if needed
            if table_update.name and table_update.name != table_name:
                connection.execute(text(f'ALTER TABLE "{table_name}" RENAME TO "{table_update.name}"'))
                table_name = table_update.name
            
            # Commit the transaction
            trans.commit()
            
            # Return the updated table schema
            inspector = inspect(engine)
            columns = []
            for column in inspector.get_columns(table_name):
                columns.append({
                    "name": column["name"],
                    "type": str(column["type"]),
                    "nullable": column["nullable"],
                    "default": str(column["default"]) if column["default"] is not None else None,
                    "primary_key": column.get("primary_key", False)
                })
            
            return {
                "name": table_name,
                "columns": columns,
                "foreign_keys": inspector.get_foreign_keys(table_name)
            }
            
        except Exception as e:
            trans.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to update table: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        connection.close()

# API Routes
@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}

# Element endpoints
@app.post("/api/v1/elements/", response_model=List[CanvasElementResponse])
async def save_elements(
    elements: List[Dict[str, Any]],  # Changed from CanvasElementCreate to Dict for better error handling
    project_id: int = 1,  # Default project ID
    db: Session = Depends(get_db)
):
    try:
        print(f"Received elements to save: {elements}")
        
        # Start a transaction
        db.begin()
        
        # Get existing elements for this project
        db_elements = db.query(CanvasElement).filter(CanvasElement.project_id == project_id).all()
        
        # Create a map of element_id to database element
        element_map = {str(elem.element_id): elem for elem in db_elements}
        
        # Get all element IDs from the request
        request_element_ids = {str(elem.get('element_id')) for elem in elements if 'element_id' in elem}
        
        # Find elements that exist in DB but not in the request (these should be deleted)
        elements_to_delete = [elem for elem in db_elements if str(elem.element_id) not in request_element_ids]
        
        # Delete elements that are not in the request
        for elem in elements_to_delete:
            print(f"Deleting element {elem.element_id} as it's not in the request")
            db.delete(elem)
        
        # Process each element from the request
        result_elements = []
        for element in elements:
            try:
                # Validate required fields
                if 'element_id' not in element:
                    raise ValueError("Missing required field: element_id")
                if 'element_type' not in element:
                    raise ValueError("Missing required field: element_type")
                if 'x' not in element or 'y' not in element:
                    raise ValueError("Missing required position fields: x and y")
                if 'properties' not in element:
                    element['properties'] = {}
                
                element_id = str(element['element_id'])
                element_type = str(element['element_type'])
                x = int(element['x'])
                y = int(element['y'])
                properties = element.get('properties', {})
                
                # Check if element exists
                if element_id in element_map:
                    # Update existing element
                    db_element = element_map[element_id]
                    db_element.x = x
                    db_element.y = y
                    db_element.updated_at = datetime.utcnow()
                    
                    # Clear existing properties
                    db.query(ElementProperty).filter(ElementProperty.element_id == db_element.id).delete()
                else:
                    # Create new element
                    print(f"Creating new element: {element_id} of type {element_type}")
                    db_element = CanvasElement(
                        project_id=project_id,
                        element_id=element_id,
                        element_type=element_type,
                        x=x,
                        y=y
                    )
                    db.add(db_element)
                
                # Add properties
                for key, value in properties.items():
                    try:
                        prop_value = json.dumps(value) if not isinstance(value, str) else value
                        prop = ElementProperty(
                            element=db_element,
                            key=str(key),
                            value=prop_value
                        )
                        db.add(prop)
                    except Exception as prop_error:
                        print(f"Error adding property {key}: {str(prop_error)}")
                        raise ValueError(f"Invalid property {key}: {str(prop_error)}")
                
                result_elements.append(db_element)
                
            except Exception as elem_error:
                print(f"Error processing element {element.get('element_id', 'unknown')}: {str(elem_error)}")
                raise ValueError(f"Error in element {element.get('element_id', 'unknown')}: {str(elem_error)}")
        
        # Commit the transaction
        db.commit()
        
        # Refresh all elements to get their properties
        response_elements = []
        for elem in result_elements:
            db.refresh(elem)
            # Build dict for response, matching GET endpoint
            properties = {}
            for prop in elem.properties:
                try:
                    try:
                        properties[prop.key] = json.loads(prop.value)
                    except (json.JSONDecodeError, TypeError):
                        properties[prop.key] = prop.value
                except Exception as e:
                    print(f"Error parsing property {prop.key}: {e}")
            element_data = {
                "id": elem.id,
                "element_id": elem.element_id,
                "element_type": elem.element_type,
                "x": elem.x,
                "y": elem.y,
                "properties": properties,
                "created_at": elem.created_at,
                "updated_at": elem.updated_at
            }
            response_elements.append(element_data)
        print(f"Successfully saved {len(response_elements)} elements")
        return response_elements
        
    except Exception as e:
        db.rollback()
        print(f"Error in save_elements: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={
            "error": "Failed to save elements",
            "message": str(e),
            "type": type(e).__name__
        })

@app.get("/api/v1/elements/", response_model=List[CanvasElementResponse])
async def get_elements(
    project_id: int = 1,  # Default project ID
    db: Session = Depends(get_db)
):
    try:
        print(f"Fetching elements for project_id: {project_id}")
        
        # Check if the project exists
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            print(f"Project with id {project_id} not found")
            return []
        
        elements = db.query(CanvasElement).filter(CanvasElement.project_id == project_id).all()
        print(f"Found {len(elements)} elements in database")
        
        result = []
        for element in elements:
            # Get all properties for this element
            properties = {}
            for prop in element.properties:
                try:
                    # Try to parse JSON, fallback to string if not JSON
                    try:
                        properties[prop.key] = json.loads(prop.value)
                    except (json.JSONDecodeError, TypeError):
                        properties[prop.key] = prop.value
                except Exception as e:
                    print(f"Error parsing property {prop.key}: {e}")
            
            # Create response object as a dict (not ORM model)
            element_data = {
                "id": element.id,
                "element_id": element.element_id,
                "element_type": element.element_type,
                "x": element.x,
                "y": element.y,
                "properties": properties,  # This is a dict, not a list of objects
                "created_at": element.created_at,
                "updated_at": element.updated_at
            }
            result.append(element_data)
            print(f"Processed element: {element_data}")
        
        print(f"Returning {len(result)} elements")
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in get_elements: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Failed to load elements",
                "message": str(e),
                "type": type(e).__name__
            }
        )

@app.post("/api/v1/projects/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/v1/projects/", response_model=List[ProjectResponse])
def list_projects(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

# Create tables and ensure default project exists on startup
@app.on_event("startup")
def startup_event():
    try:
        print("Starting up application...")
        
        # Create database tables
        print("Creating database tables...")
        create_tables()
        print("Database tables created successfully")
        
        # Get a database session
        db = SessionLocal()
        try:
            # Check if default project exists
            default_project = db.query(Project).filter(Project.id == 1).first()
            if not default_project:
                print("Creating default project...")
                default_project = Project(
                    id=1,
                    name="Default Project",
                    description="Automatically created default project"
                )
                db.add(default_project)
                db.commit()
                print("Default project created successfully")
            else:
                print(f"Default project already exists: {default_project.name} (ID: {default_project.id})")
                
        except Exception as e:
            print(f"Error initializing default project: {str(e)}")
            db.rollback()
            raise
        finally:
            db.close()
            
        print("Startup completed successfully")
        
    except Exception as e:
        print(f"Error during startup: {str(e)}")
        raise
