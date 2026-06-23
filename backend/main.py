from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
import io

from auth import router as auth_router
from prediction import ModelCompatibilityError, predict_rows

app = FastAPI(
    title="Age Assessment & Disease Risk Prediction API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "API is working"
    }


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Endpoint para cargar un archivo CSV con datos de pacientes para hacer inferencias
    """
    try:
        # Validar que sea un archivo CSV
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="El archivo debe ser un CSV"
            )
        
        # Leer el contenido del archivo
        contents = await file.read()
        
        # Decodificar el contenido
        try:
            csv_content = contents.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="El archivo debe estar en formato UTF-8"
            )
        
        # Parsear el CSV
        csv_file = io.StringIO(csv_content)
        csv_reader = csv.DictReader(csv_file)
        
        # Validar que el CSV tenga datos
        rows = list(csv_reader)
        if not rows:
            raise HTTPException(
                status_code=400,
                detail="El archivo CSV está vacío"
            )
        
        # Validar que tenga encabezados
        if not csv_reader.fieldnames:
            raise HTTPException(
                status_code=400,
                detail="El archivo CSV no tiene encabezados"
            )
        
        # Aquí puedes procesar los datos o enviarlos al modelo de IA
        # Por ahora, simplemente retornamos información sobre el archivo
        
        try:
            required_features, predictions = predict_rows(rows)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error))
        except ModelCompatibilityError as error:
            raise HTTPException(status_code=503, detail=str(error))

        return {
            "status": "success",
            "message": f"Archivo '{file.filename}' cargado exitosamente",
            "filename": file.filename,
            "rows_count": len(rows),
            "columns": list(csv_reader.fieldnames),
            "data": rows[:5],
            "required_features": required_features,
            "predictions": predictions,
            "model_scope_notice": (
                "Methylation classifier active: Alzheimer/control risk is calculated from age, "
                "gender, sample_type, and the selected CpG methylation features. Biological age "
                "is calculated with the paired methylation regression artifact."
            )
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el archivo: {str(e)}"
        )
