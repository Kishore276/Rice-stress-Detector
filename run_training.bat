@echo off
echo ===================================================
echo Rice Disease Detection - Model Training
echo ===================================================
echo.
echo Installing required packages...
pip install -r requirements.txt
echo.
echo Starting training...
python train_model.py
echo.
echo Training complete!
pause
