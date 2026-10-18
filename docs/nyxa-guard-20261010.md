# Nyxa — stała garda, 10.10.2026

Zgłoszenie operatora: w spoczynku Nyxa rozgrzewa się z wyprostowanymi rękami zamiast stać w gardzie.
Przyczyna: IDLE używało fragmentu Boxing_Warmup (.25–1.75s).
Zmiana: IDLE korzysta wyłącznie z pozy początkowej Right_Jab_from_Guard, jedna klatka. Nie odtwarza rozgrzewki ani ruchu rąk w spoczynku. Ta sama konfiguracja dotyczy gracza i CPU.
Pozostałe animacje oraz wejście Proud_Strut zachowane zgodnie z wcześniejszym zleceniem.
Weryfikacja: GLTFLoader + AnimationMixer, IDLE ma jedną klatkę i clip Right_Jab_from_Guard t=0. Zgodność kanałów i hitboxy pozostałych ataków PASS. Brak wizualnego podglądu WebGL.

Dodatkowe zlecenie operatora: przyspieszyć Nyxę trochę. Ataki i ruch +10% wobec wersji 45: ataki 1.595, kontra 3.08, chód 1.6104, skok 1.375. Prezentacja zachowuje tempo 1.15. Stała garda pozostaje nieruchoma.
