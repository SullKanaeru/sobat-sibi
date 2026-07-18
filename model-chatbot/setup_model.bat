@echo off
echo Creating Gestura AI model in Ollama...
ollama create gestura-sibi -f Modelfile
echo.
echo Model gestura-sibi created successfully!
echo You can test it by running: ollama run gestura-sibi
pause
