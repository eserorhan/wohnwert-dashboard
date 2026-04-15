#!/bin/bash
echo "Berechne WohnWert-Subscores..."
cd "$(dirname "$0")"
python3 calculate_wohnwert_subscores.py
echo ""
echo "Fertig! WohnWert-Gewichtung ist jetzt aktiv."
